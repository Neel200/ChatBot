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
 * Call this ONCE during a user-gesture (e.g. the voice-mode button click).
 * It fires a silent utterance to "unlock" the Web Speech API so later
 * async calls (after fetch/await) aren't blocked by autoplay policy.
 */
export function unlockTTS(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const dummy = new SpeechSynthesisUtterance(" ");
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

  const doSpeak = () => {
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Chrome bug: speechSynthesis pauses/stops after ~15 seconds.
    // Calling resume() every 5 s keeps it alive for long responses.
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

    window.speechSynthesis.speak(utterance);
  };

  // Voices may not be loaded yet on first call — wait if needed
  if (window.speechSynthesis.getVoices().length > 0) {
    doSpeak();
  } else {
    window.speechSynthesis.addEventListener("voiceschanged", doSpeak, { once: true });
  }
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
