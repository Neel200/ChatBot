import type { File } from "formidable";

export async function audioToText(audio: File): Promise<string> {
  // Mark parameter as "used" without doing anything with it.
  void audio;

  // Placeholder until real STT is added.
  return "Voice message received (transcription disabled in this build).";
}
