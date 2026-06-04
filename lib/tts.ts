// lib/tts.ts — browser Text-to-Speech using the Web Speech Synthesis API

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, "code block")
    .replace(/`[^`]+`/g, "")
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*([\s\S]+?)\*\*/g, "$1")
    .replace(/\*([\s\S]+?)\*/g, "$1")
    .replace(/__([\s\S]+?)__/g, "$1")
    .replace(/_([\s\S]+?)_/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/!\[.*?\]\(.+?\)/g, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Call this once during a direct user gesture (e.g. the voice-mode button click)
 * so the browser "unlocks" the speech synthesis API for later async calls.
 */
export function unlockTTS(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  // Speak a silent dot — volume 0 so the user hears nothing,
  // but it counts as a user-gesture-initiated call that warms up the engine.
  const dummy = new SpeechSynthesisUtterance(".");
  dummy.volume = 0;
  dummy.rate = 10;
  window.speechSynthesis.speak(dummy);
}

export function speak(text: string, onEnd?: () => void): void {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();

  const clean = stripMarkdown(text);
  if (!clean) {
    onEnd?.();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  // Chrome bug: speechSynthesis pauses/stops after ~15 s on long responses.
  // Calling resume() every 5 s keeps it going.
  const keepAlive = setInterval(() => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }, 5000);

  utterance.onend = () => {
    clearInterval(keepAlive);
    onEnd?.();
  };
  utterance.onerror = () => {
    clearInterval(keepAlive);
    onEnd?.();
  };

  // Chrome bug: calling cancel() then speak() immediately can silently fail.
  // A 100 ms delay lets cancel() fully settle before we enqueue the utterance.
  setTimeout(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.speak(utterance);
    }
  }, 100);
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
