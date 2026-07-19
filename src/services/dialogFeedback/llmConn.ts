import { getProvider } from "../../config/apiProvider";

export async function getDialogFeedback(transcription: string) {
  const provider = getProvider();
  const prompt = process.env.FEEDBACK_SYSTEM_PROMPT;
  if (!prompt) {
    console.log("no system prompt provided");
    return;
  }
  const response = await provider.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: prompt,
      },
      {
        role: "user",
        content: `Analyze and give feedback on this dialog:\n\n ${transcription}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  console.log("received llm response:");
  console.log({ response });
  return response.choices[0].message.content;
}
