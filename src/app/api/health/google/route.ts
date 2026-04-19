import { NextResponse } from "next/server";
import {
  getGoogleAsrLocation,
  getGoogleGenAI,
  getGoogleLocation,
  getGoogleProject,
  getImplicitRecognizerName,
  getSpeechClient,
  hasGoogleCloudConfig
} from "@/lib/google-client";

export async function GET() {
  const checks: Record<string, { ok: boolean; detail: string }> = {
    env: {
      ok: false,
      detail: "Missing GOOGLE_CLOUD_PROJECT or GOOGLE_CLOUD_LOCATION."
    },
    recognizer: {
      ok: false,
      detail: "Recognizer name not available."
    },
    speechClient: {
      ok: false,
      detail: "Speech client not initialized."
    },
    geminiClient: {
      ok: false,
      detail: "Gemini client not initialized."
    }
  };

  try {
    if (!hasGoogleCloudConfig()) {
      return NextResponse.json(
        {
          ok: false,
          checks
        },
        { status: 500 }
      );
    }

    const project = getGoogleProject();
    const location = getGoogleLocation();
    const asrLocation = getGoogleAsrLocation();

    checks.env = {
      ok: true,
      detail: `project=${project}, location=${location}, asrLocation=${asrLocation}`
    };

    const recognizerName = getImplicitRecognizerName();
    checks.recognizer = {
      ok: true,
      detail: recognizerName
    };

    const speechClient = getSpeechClient();
    await speechClient.initialize();
    checks.speechClient = {
      ok: true,
      detail: `apiEndpoint=${speechClient.apiEndpoint}`
    };

    getGoogleGenAI();
    checks.geminiClient = {
      ok: true,
      detail: `vertexai project=${project} location=${location}`
    };

    return NextResponse.json({
      ok: true,
      checks
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        ok: false,
        error: message,
        checks
      },
      { status: 500 }
    );
  }
}
