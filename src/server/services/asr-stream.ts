import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import type { v2 } from "@google-cloud/speech";
import { buildRecognitionConfig, getAsrModel } from "@/lib/asr-client";
import { getImplicitRecognizerName, getSpeechClient } from "@/lib/google-client";
import type { AudioInputMetadata, AsrStreamEvent, AsrStreamSession } from "@/types/report";
import type { protos } from "@google-cloud/speech";

type SpeechStream = ReturnType<v2.SpeechClient["_streamingRecognize"]>;
type StreamListener = (event: AsrStreamEvent) => void;

interface StreamingSessionState {
  id: string;
  model: string | null;
  metadata?: AudioInputMetadata;
  finalSegments: string[];
  interimTranscript: string;
  currentTranscript: string;
  stream: SpeechStream | null;
  emitter: EventEmitter;
  closed: boolean;
  cleanupTimer: NodeJS.Timeout | null;
}

const SESSION_TTL_MS = 60_000;

function getSessionStore(): Map<string, StreamingSessionState> {
  const globalState = globalThis as typeof globalThis & {
    __concordAsrSessions?: Map<string, StreamingSessionState>;
  };

  if (!globalState.__concordAsrSessions) {
    globalState.__concordAsrSessions = new Map();
  }

  return globalState.__concordAsrSessions;
}

function buildTranscript(state: StreamingSessionState): string {
  return [...state.finalSegments, state.interimTranscript].filter(Boolean).join("\n").trim();
}

function scheduleCleanup(sessionId: string) {
  const state = getSessionStore().get(sessionId);

  if (!state) {
    return;
  }

  if (state.cleanupTimer) {
    clearTimeout(state.cleanupTimer);
  }

  state.cleanupTimer = setTimeout(() => {
    const current = getSessionStore().get(sessionId);
    if (!current) {
      return;
    }

    current.emitter.removeAllListeners();
    getSessionStore().delete(sessionId);
  }, SESSION_TTL_MS);
}

function emitEvent(state: StreamingSessionState, event: AsrStreamEvent) {
  state.emitter.emit("event", event);
}

function emitTranscript(state: StreamingSessionState, isFinal: boolean) {
  const transcript = buildTranscript(state);

  if (!transcript || transcript === state.currentTranscript) {
    return;
  }

  state.currentTranscript = transcript;

  emitEvent(state, {
    type: "transcript",
    transcript,
    interimTranscript: state.interimTranscript,
    finalTranscript: state.finalSegments.join("\n").trim(),
    isFinal,
    model: state.model
  });
}

function resolveSession(sessionId: string): StreamingSessionState {
  const state = getSessionStore().get(sessionId);

  if (!state) {
    throw new Error("Streaming ASR session not found.");
  }

  return state;
}

function closeSession(sessionId: string) {
  const state = getSessionStore().get(sessionId);

  if (!state) {
    return;
  }

  state.closed = true;
  scheduleCleanup(sessionId);
}

function attachStreamHandlers(state: StreamingSessionState) {
  if (!state.stream) {
    return;
  }

  state.stream.on("data", (response: protos.google.cloud.speech.v2.IStreamingRecognizeResponse) => {
    let changed = false;
    let sawFinal = false;

    for (const result of response.results ?? []) {
      const transcript = result.alternatives?.[0]?.transcript?.trim() ?? "";

      if (!transcript) {
        continue;
      }

      changed = true;

      if (result.isFinal) {
        state.finalSegments.push(transcript);
        state.interimTranscript = "";
        sawFinal = true;
        continue;
      }

      state.interimTranscript = transcript;
    }

    if (changed) {
      emitTranscript(state, sawFinal);
    }
  });

  state.stream.on("error", (error: Error) => {
    emitEvent(state, {
      type: "error",
      transcript: buildTranscript(state),
      model: state.model,
      message: error.message
    });
    closeSession(state.id);
  });

  state.stream.on("end", () => {
    emitEvent(state, {
      type: "done",
      transcript: buildTranscript(state),
      model: state.model
    });
    closeSession(state.id);
  });
}

function ensureSpeechStream(state: StreamingSessionState) {
  if (state.stream) {
    return;
  }

  state.stream = getSpeechClient()._streamingRecognize();
  attachStreamHandlers(state);
  state.stream.write({
    recognizer: getImplicitRecognizerName(),
    streamingConfig: {
      config: buildRecognitionConfig(state.metadata),
      streamingFeatures: {
        interimResults: true,
        enableVoiceActivityEvents: true
      }
    }
  });
}

export async function createStreamingAsrSession(
  metadata?: AudioInputMetadata
): Promise<AsrStreamSession> {
  const sessionId = randomUUID();
  const state: StreamingSessionState = {
    id: sessionId,
    model: getAsrModel(),
    metadata,
    finalSegments: [],
    interimTranscript: "",
    currentTranscript: "",
    stream: null,
    emitter: new EventEmitter(),
    closed: false,
    cleanupTimer: null
  };

  getSessionStore().set(sessionId, state);

  return {
    sessionId,
    model: state.model
  };
}

export async function pushStreamingAudioChunk(sessionId: string, file: File): Promise<void> {
  const state = resolveSession(sessionId);

  if (state.closed) {
    throw new Error("Streaming ASR session already closed.");
  }

  ensureSpeechStream(state);

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length === 0) {
    return;
  }

  state.stream?.write({ audio: buffer });
}

export function stopStreamingAsrSession(sessionId: string): { transcript: string; model: string | null } {
  const state = resolveSession(sessionId);

  if (!state.closed && state.stream) {
    state.stream.end();
  } else if (!state.stream) {
    emitEvent(state, {
      type: "done",
      transcript: buildTranscript(state),
      model: state.model
    });
    closeSession(sessionId);
  }

  return {
    transcript: buildTranscript(state),
    model: state.model
  };
}

export function destroyStreamingAsrSession(sessionId: string): void {
  const state = getSessionStore().get(sessionId);

  if (!state) {
    return;
  }

  state.stream?.destroy();
  state.emitter.removeAllListeners();
  if (state.cleanupTimer) {
    clearTimeout(state.cleanupTimer);
  }
  getSessionStore().delete(sessionId);
}

export function subscribeToStreamingAsrSession(
  sessionId: string,
  listener: StreamListener
): () => void {
  const state = resolveSession(sessionId);

  if (state.cleanupTimer) {
    clearTimeout(state.cleanupTimer);
    state.cleanupTimer = null;
  }

  state.emitter.on("event", listener);

  if (state.currentTranscript) {
    listener({
      type: "transcript",
      transcript: state.currentTranscript,
      interimTranscript: state.interimTranscript,
      finalTranscript: state.finalSegments.join("\n").trim(),
      isFinal: false,
      model: state.model
    });
  }

  return () => {
    state.emitter.off("event", listener);
    if (state.closed && state.emitter.listenerCount("event") === 0) {
      scheduleCleanup(sessionId);
    }
  };
}
