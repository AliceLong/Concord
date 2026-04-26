import { v2 } from "@google-cloud/speech";

let speechClient = null;
const FRAME_META_PREFIX = "TSMETA::";

function getAsrLocation() {
  return process.env.GOOGLE_ASR_LOCATION ?? "us";
}

function getAsrLanguage() {
  return process.env.GOOGLE_ASR_LANGUAGE ?? "yue-Hant-HK";
}

function getAsrModel() {
  return process.env.GOOGLE_ASR_MODEL ?? "chirp_3";
}

function getProject() {
  const project = process.env.GOOGLE_CLOUD_PROJECT;

  if (!project) {
    throw new Error("GOOGLE_CLOUD_PROJECT is missing.");
  }

  return project;
}

function getRecognizerName() {
  return `projects/${getProject()}/locations/${getAsrLocation()}/recognizers/_`;
}

function getSpeechClient() {
  if (speechClient) {
    return speechClient;
  }

  const location = getAsrLocation();
  const apiEndpoint = location === "global" ? "speech.googleapis.com" : `${location}-speech.googleapis.com`;
  speechClient = new v2.SpeechClient({ apiEndpoint });
  return speechClient;
}

function createRecognitionConfig(languageCode) {
  return {
    explicitDecodingConfig: {
      encoding: "LINEAR16",
      sampleRateHertz: 16000,
      audioChannelCount: 1
    },
    languageCodes: [languageCode || getAsrLanguage()],
    model: getAsrModel()
  };
}

function sendJson(ws, payload) {
  if (ws.readyState !== ws.OPEN) {
    return;
  }

  ws.send(JSON.stringify(payload));
}

function buildTranscript(finalSegments, interimTranscript) {
  return [...finalSegments, interimTranscript].filter(Boolean).join("\n").trim();
}

function roundLatency(value) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.round(value)) : undefined;
}

function extractFrameMetadata(data) {
  const buffer = Buffer.from(data);
  const prefixBuffer = Buffer.from(FRAME_META_PREFIX, "utf8");

  if (buffer.length <= prefixBuffer.length || !buffer.subarray(0, prefixBuffer.length).equals(prefixBuffer)) {
    return { audio: buffer };
  }

  const newlineIndex = buffer.indexOf(0x0a, prefixBuffer.length);

  if (newlineIndex === -1) {
    return { audio: buffer };
  }

  const timestampText = buffer.subarray(prefixBuffer.length, newlineIndex).toString("utf8");
  const clientSentAt = Number.parseInt(timestampText, 10);

  return {
    clientSentAt: Number.isFinite(clientSentAt) ? clientSentAt : undefined,
    audio: buffer.subarray(newlineIndex + 1)
  };
}

export function attachAsrWebSocketServer(wss) {
  wss.on("connection", (ws) => {
    let googleStream = null;
    let started = false;
    let stopped = false;
    let languageCode = getAsrLanguage();
    let finalSegments = [];
    let interimTranscript = "";
    let currentTranscript = "";
    let latestMetrics = null;

    const emitTranscript = (isFinal) => {
      const transcript = buildTranscript(finalSegments, interimTranscript);

      if (!transcript || transcript === currentTranscript) {
        return;
      }

      currentTranscript = transcript;
      sendJson(ws, {
        type: "transcript",
        transcript,
        isFinal,
        model: getAsrModel(),
        metrics: latestMetrics ?? undefined
      });
    };

    const teardownGoogleStream = () => {
      if (!googleStream) {
        return;
      }

      googleStream.removeAllListeners();
      googleStream.destroy();
      googleStream = null;
    };

    const ensureGoogleStream = () => {
      if (googleStream) {
        return;
      }

      googleStream = getSpeechClient()._streamingRecognize();

      googleStream.on("data", (response) => {
        let changed = false;
        let sawFinal = false;
        const googleRespondedAt = Date.now();

        if (latestMetrics) {
          latestMetrics = {
            ...latestMetrics,
            googleRespondedAt,
            clientToServerMs: roundLatency(
              latestMetrics.clientSentAt && latestMetrics.serverReceivedAt
                ? latestMetrics.serverReceivedAt - latestMetrics.clientSentAt
                : undefined
            ),
            serverToGoogleResultMs: roundLatency(
              latestMetrics.serverReceivedAt ? googleRespondedAt - latestMetrics.serverReceivedAt : undefined
            ),
            endToEndMs: roundLatency(
              latestMetrics.clientSentAt ? googleRespondedAt - latestMetrics.clientSentAt : undefined
            )
          };
        }

        for (const result of response.results ?? []) {
          const transcript = result.alternatives?.[0]?.transcript?.trim() ?? "";

          if (!transcript) {
            continue;
          }

          changed = true;

          if (result.isFinal) {
            finalSegments.push(transcript);
            interimTranscript = "";
            sawFinal = true;
            continue;
          }

          interimTranscript = transcript;
        }

        if (changed) {
          emitTranscript(sawFinal);
        }
      });

      googleStream.on("error", (error) => {
        const message = error?.message ?? "Unknown streaming error";
        const benignTimeout = message.includes("Stream timed out after receiving no more client requests");

        if (benignTimeout && stopped) {
          sendJson(ws, {
            type: "done",
            transcript: buildTranscript(finalSegments, interimTranscript),
            model: getAsrModel()
          });
        } else {
          sendJson(ws, {
            type: "error",
            message,
            transcript: buildTranscript(finalSegments, interimTranscript),
            model: getAsrModel()
          });
        }

        teardownGoogleStream();
      });

      googleStream.on("end", () => {
        sendJson(ws, {
          type: "done",
          transcript: buildTranscript(finalSegments, interimTranscript),
          model: getAsrModel()
        });
        teardownGoogleStream();
      });

      googleStream.write({
        recognizer: getRecognizerName(),
        streamingConfig: {
          config: createRecognitionConfig(languageCode),
          streamingFeatures: {
            interimResults: true,
            enableVoiceActivityEvents: true
          }
        }
      });
    };

    sendJson(ws, { type: "ready", model: getAsrModel() });

    ws.on("message", (data, isBinary) => {
      if (isBinary) {
        if (!started || stopped) {
          return;
        }

        const serverReceivedAt = Date.now();
        const { audio, clientSentAt } = extractFrameMetadata(data);

        if (!audio.length) {
          return;
        }

        latestMetrics = {
          clientSentAt,
          serverReceivedAt
        };
        ensureGoogleStream();
        googleStream.write({ audio });
        return;
      }

      let message;

      try {
        message = JSON.parse(data.toString());
      } catch {
        sendJson(ws, {
          type: "error",
          message: "Invalid WebSocket JSON message.",
          transcript: buildTranscript(finalSegments, interimTranscript),
          model: getAsrModel()
        });
        return;
      }

      if (message.type === "start") {
        started = true;
        stopped = false;
        languageCode = message.languageCode || getAsrLanguage();
        finalSegments = [];
        interimTranscript = "";
        currentTranscript = "";
        return;
      }

      if (message.type === "stop") {
        stopped = true;

        if (!googleStream) {
          sendJson(ws, {
            type: "done",
            transcript: buildTranscript(finalSegments, interimTranscript),
            model: getAsrModel()
          });
          return;
        }

        googleStream.end();
      }
    });

    ws.on("close", () => {
      stopped = true;
      teardownGoogleStream();
    });
  });
}
