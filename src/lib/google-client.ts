import {v2, protos} from "@google-cloud/speech";
import {GoogleGenAI, Type} from "@google/genai";

let speechClient: v2.SpeechClient | null = null;
let googleGenAI: GoogleGenAI | null = null;

export function hasGoogleCloudConfig(): boolean {
  return Boolean(process.env.GOOGLE_CLOUD_PROJECT && process.env.GOOGLE_CLOUD_LOCATION);
}

export function getGoogleProject(): string {
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  if (!project) {
    throw new Error("GOOGLE_CLOUD_PROJECT is missing. Configure it before calling Google AI routes.");
  }

  return project;
}

export function getGoogleLocation(): string {
  const location = process.env.GOOGLE_CLOUD_LOCATION;
  if (!location) {
    throw new Error("GOOGLE_CLOUD_LOCATION is missing. Configure it before calling Google AI routes.");
  }

  return location;
}

export function getGoogleAsrLocation(): string {
  return process.env.GOOGLE_ASR_LOCATION ?? "us";
}

export function getSpeechClient(): v2.SpeechClient {
  if (speechClient) {
    return speechClient;
  }

  const asrLocation = getGoogleAsrLocation();
  const apiEndpoint = asrLocation === "global" ? "speech.googleapis.com" : `${asrLocation}-speech.googleapis.com`;

  speechClient = new v2.SpeechClient({apiEndpoint});
  return speechClient;
}

export function getGoogleGenAI(): GoogleGenAI {
  if (googleGenAI) {
    return googleGenAI;
  }

  googleGenAI = new GoogleGenAI({
    vertexai: true,
    project: getGoogleProject(),
    location: getGoogleLocation()
  });

  return googleGenAI;
}

export function getImplicitRecognizerName(): string {
  return `projects/${getGoogleProject()}/locations/${getGoogleAsrLocation()}/recognizers/_`;
}

export function getGoogleReportSchema(): Record<string, unknown> {
  return {
    type: Type.OBJECT,
    properties: {
      elderStatus: {
        type: Type.OBJECT,
        properties: {
          statusTags: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          interactionPerformance: {
            type: Type.STRING
          },
          physicalCondition: {
            type: Type.STRING
          }
        },
        required: ["statusTags", "interactionPerformance", "physicalCondition"],
        propertyOrdering: ["statusTags", "interactionPerformance", "physicalCondition"]
      },
      completedServices: {
        type: Type.OBJECT,
        properties: {
          serviceItems: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          completion: {
            type: Type.STRING
          },
          elderPerformance: {
            type: Type.STRING
          }
        },
        required: ["serviceItems", "completion", "elderPerformance"],
        propertyOrdering: ["serviceItems", "completion", "elderPerformance"]
      },
      moduleReports: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            moduleId: {
              type: Type.STRING
            },
            moduleTitle: {
              type: Type.STRING
            },
            serviceContent: {
              type: Type.STRING
            },
            elderResponse: {
              type: Type.STRING
            },
            completion: {
              type: Type.STRING
            },
            remarks: {
              type: Type.STRING
            }
          },
          required: ["moduleId", "moduleTitle", "serviceContent", "elderResponse", "completion", "remarks"],
          propertyOrdering: ["moduleId", "moduleTitle", "serviceContent", "elderResponse", "completion", "remarks"]
        }
      },
      summaryAndRemarks: {
        type: Type.OBJECT,
        properties: {
          summary: {
            type: Type.STRING
          },
          incident: {
            type: Type.STRING
          },
          recommendation: {
            type: Type.STRING
          }
        },
        required: ["summary", "incident", "recommendation"],
        propertyOrdering: ["summary", "incident", "recommendation"]
      }
    },
    required: ["elderStatus", "completedServices", "moduleReports", "summaryAndRemarks"],
    propertyOrdering: ["elderStatus", "completedServices", "moduleReports", "summaryAndRemarks"]
  };
}

export type SpeechRecognitionConfig = protos.google.cloud.speech.v2.IRecognitionConfig;
