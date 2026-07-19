import { getProvider, SpeakerTranscription } from "../../config/apiProvider";
import fs from "fs";

export const transcribedCalls = new Set<string>();

async function transcribe(speaker: string, audioPath: string) {
  const provider = getProvider();
  if (!provider) {
    return { error: "No provider found", result: null };
  }
  try {
    const transcription = (await provider.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-large-v3-turbo",
      response_format: "verbose_json",
      language: "en",
      temperature: 0.0,
      prompt: "One speakser's part in an educational IELTS dialogue",
    })) as unknown as SpeakerTranscription;

    return {
      error: null,
      result: {
        speaker: speaker,
        transcription: transcription,
      },
    };
  } catch (error) {
    console.log("error while transcribing audio:", error);
    return { error: (error as Error).message, result: null };
  }
}

export async function transcribeDialog(speaker1: string, audioPath1: string, speaker2: string, audioPath2: string) {
  const [res1, res2] = await Promise.all([transcribe(speaker1, audioPath1), transcribe(speaker2, audioPath2)]);

  if (res1.error || res2.error || !res1.result || !res2.result) {
    return { error: res1.error || res2.error, result: null };
  }

  const segments1 = res1.result?.transcription.segments.map((seg) => ({ ...seg, speaker: speaker1 }));
  const segments2 = res2.result?.transcription.segments.map((seg) => ({ ...seg, speaker: speaker2 }));

  const mergedSegments = [...segments1, ...segments2].sort((a, b) => a.start - b.start);

  const dialogText = mergedSegments.map((seg) => `[${seg.speaker}] ${seg.text.trim()}`).join("\n");

  return {
    error: null,
    result: {
      text: dialogText,
      segments: mergedSegments,
      duration: res1.result?.transcription.duration,
    },
  };
}
