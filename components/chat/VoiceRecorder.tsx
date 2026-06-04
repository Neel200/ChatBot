"use client";

import React, { useRef } from "react";
import type { Dispatch, SetStateAction } from "react";

interface Props {
  isRecording: boolean;
  setIsRecording: Dispatch<SetStateAction<boolean>>;
  setInput: Dispatch<SetStateAction<string>>;
}

export default function VoiceRecorder({
  isRecording,
  setIsRecording,
  setInput,
}: Props) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startVoice = (): void => {
    const SpeechRecognitionClass =
      (window as unknown as { SpeechRecognition?: typeof SpeechRecognition })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition })
        .webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      alert("Your browser does not support Speech Recognition.");
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognitionRef.current = recognition;

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsRecording(true);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setInput(text);
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognition.start();
  };

  const stopVoice = (): void => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  const handleMicClick = (): void => {
    if (isRecording) stopVoice();
    else startVoice();
  };

  return (
    <button
      onClick={handleMicClick}
      className={`absolute right-14 flex h-9 w-9 items-center justify-center rounded-full transition ${
        isRecording
          ? "bg-red-500 text-white"
          : "bg-slate-100 hover:bg-slate-200 text-slate-600"
      }`}
      aria-label="Record voice"
    >
      {isRecording ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 24 24"
          className="w-4 h-4"
        >
          <circle cx="12" cy="12" r="6" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 18a4 4 0 004-4V7a4 4 0 10-8 0v7a4 4 0 004 4z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 11a7 7 0 01-14 0"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 18v3m-4 0h8"
          />
        </svg>
      )}
    </button>
  );
}
