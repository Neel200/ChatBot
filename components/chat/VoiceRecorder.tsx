"use client";

import React, { useRef, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";

interface Props {
  isRecording: boolean;
  setIsRecording: Dispatch<SetStateAction<boolean>>;
  setInput: Dispatch<SetStateAction<string>>;
  voiceMode?: boolean;
  onAutoSend?: (text: string) => void;
  autoStartTrigger?: number;
  isSpeaking?: boolean;
}

export default function VoiceRecorder({
  isRecording,
  setIsRecording,
  setInput,
  voiceMode = false,
  onAutoSend,
  autoStartTrigger = 0,
  isSpeaking = false,
}: Props) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef("");
  const voiceModeRef = useRef(voiceMode);
  const onAutoSendRef = useRef(onAutoSend);
  const startVoiceFnRef = useRef<(() => void) | null>(null);

  // Keep refs current so closures always see the latest values
  voiceModeRef.current = voiceMode;
  onAutoSendRef.current = onAutoSend;

  const startVoice = (): void => {
    const SpeechRecognitionClass =
      (window as unknown as { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      alert("Your browser does not support Speech Recognition.");
      return;
    }

    finalTranscriptRef.current = "";
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
      finalTranscriptRef.current = text;
      setInput(text);
    };

    recognition.onerror = () => setIsRecording(false);

    recognition.onend = () => {
      setIsRecording(false);
      if (voiceModeRef.current && onAutoSendRef.current && finalTranscriptRef.current.trim()) {
        const t = finalTranscriptRef.current.trim();
        finalTranscriptRef.current = "";
        setInput("");
        onAutoSendRef.current(t);
      }
    };

    recognition.start();
  };

  startVoiceFnRef.current = startVoice;

  // Auto-restart mic after TTS ends — 300ms delay avoids echo from speakers
  useEffect(() => {
    if (!voiceMode || !autoStartTrigger) return;
    const timer = setTimeout(() => startVoiceFnRef.current?.(), 300);
    return () => clearTimeout(timer);
  }, [autoStartTrigger, voiceMode]);

  const stopVoice = (): void => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  const handleMicClick = (): void => {
    if (isSpeaking) return;
    if (isRecording) stopVoice();
    else startVoice();
  };

  return (
    <button
      onClick={handleMicClick}
      disabled={isSpeaking}
      className={`absolute right-14 flex h-9 w-9 items-center justify-center rounded-full transition ${
        isSpeaking
          ? "bg-amber-100 text-amber-500 cursor-not-allowed"
          : isRecording
          ? "bg-red-500 text-white"
          : "bg-slate-100 hover:bg-slate-200 text-slate-600"
      }`}
      aria-label={isSpeaking ? "AI is speaking" : isRecording ? "Stop recording" : "Record voice"}
    >
      {isSpeaking ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-5 h-5 animate-pulse"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
          />
        </svg>
      ) : isRecording ? (
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
