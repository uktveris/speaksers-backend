import Groq from "groq-sdk";
import { Transcription } from "groq-sdk/resources/audio/transcriptions";

let provider: Groq | null = null;

export interface SpeakerTranscription {
  task: string;
  language: string;
  duration: number;
  text: string;
  segments: Array<{
    id: number;
    seek: number;
    start: number;
    end: number;
    text: string;
    tokens: number[];
    temperature: number;
    avg_logprob: number;
    compression_ratio: number;
    no_speech_prob: number;
  }>;
  x_groq?: {
    id: string;
  };
}

function initialize() {
  if (provider) {
    return provider;
  }
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    console.log("no groq api key provided");
  }
  provider = new Groq({ apiKey: key });
  return provider;
}

export function getProvider() {
  if (!provider) {
    return initialize();
  }
  return provider;
}
