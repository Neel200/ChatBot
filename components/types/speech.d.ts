// components/types/speech.d.ts

declare global {
  interface SpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;

    start(): void;
    stop(): void;
    abort(): void;

    // Event handlers — REQUIRED FOR ChatInput.tsx
    onstart: ((ev: Event) => void) | null;
    onend: ((ev: Event) => void) | null;
    onerror: ((ev: Event) => void) | null;
    onresult: ((ev: SpeechRecognitionEvent) => void) | null;
    onspeechstart: ((ev: Event) => void) | null;
    onspeechend: ((ev: Event) => void) | null;
    onsoundstart: ((ev: Event) => void) | null;
    onsoundend: ((ev: Event) => void) | null;
    onaudiostart: ((ev: Event) => void) | null;
    onaudioend: ((ev: Event) => void) | null;
  }

  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionResult {
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
  }

  interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
  }

  // Global constructors
  const SpeechRecognition: {
    new (): SpeechRecognition;
  };

  const webkitSpeechRecognition: {
    new (): SpeechRecognition;
  };
}

export {};