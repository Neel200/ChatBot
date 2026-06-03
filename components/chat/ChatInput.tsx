"use client";

import React, { useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import VoiceRecorder from "./VoiceRecorder";

interface Props {
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  sendMessage: () => Promise<void>;
  loading: boolean;
  stopGenerating: () => void;
  selectedFile: File | null;
  setSelectedFile: Dispatch<SetStateAction<File | null>>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  removeSelectedFile: () => void;
  isRecording: boolean;
  setIsRecording: Dispatch<SetStateAction<boolean>>;
  voiceMode: boolean;
  onToggleVoiceMode: () => void;
  isSpeaking: boolean;
  onAutoSend: (text: string) => void;
  autoStartTrigger: number;
}

export default function ChatInput({
  input,
  setInput,
  sendMessage,
  loading,
  stopGenerating,
  selectedFile,
  fileInputRef,
  handleFileChange,
  removeSelectedFile,
  isRecording,
  setIsRecording,
  voiceMode,
  onToggleVoiceMode,
  isSpeaking,
  onAutoSend,
  autoStartTrigger,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    const el = textareaRef.current;
    if (!el) return;

    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && (input.trim() || selectedFile)) {
      e.preventDefault();
      void sendMessage();

      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
      });
    }
  };

  return (
    <div className="w-full max-w-4xl mt-2 px-0 sm:mt-4 sm:px-1">
      {selectedFile && (
        <div className="mb-2 flex items-center overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-sm backdrop-blur-md">
          <span className="mr-2 truncate text-sm font-medium text-slate-700">
            Attached: {selectedFile.name}
          </span>
          <button
            onClick={removeSelectedFile}
            className="ml-auto flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-red-50 hover:text-red-500"
            aria-label="Remove attached file"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {voiceMode && (
        <div className={`mb-2 flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-xs font-medium transition ${
          isSpeaking
            ? "border-amber-200 bg-amber-50 text-amber-700"
            : isRecording
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-indigo-200 bg-indigo-50 text-indigo-700"
        }`}>
          <span className={`h-2 w-2 rounded-full flex-shrink-0 ${
            isSpeaking
              ? "bg-amber-500 animate-pulse"
              : isRecording
              ? "bg-red-500 animate-pulse"
              : "bg-indigo-400"
          }`} />
          {isSpeaking
            ? "AI is speaking..."
            : isRecording
            ? "Listening..."
            : "Voice mode on — mic starts after each response"}
        </div>
      )}

      <div className={`relative flex items-center rounded-[24px] border bg-white/95 py-2 pl-2 pr-24 shadow-[0_18px_50px_rgba(15,23,42,0.14)] backdrop-blur-md transition focus-within:ring-4 ${
        voiceMode
          ? "border-indigo-300 focus-within:border-indigo-400 focus-within:ring-indigo-100"
          : "border-slate-200 focus-within:border-indigo-300 focus-within:ring-indigo-100"
      } sm:py-3 sm:pl-3`}>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*, application/pdf, text/*, .txt, .js, .ts, .jsx, .tsx, .css, .html, .py, .java, .c, .cpp, .json, .md, .csv, .doc, .docx"
        />

        {/* Attach file */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`mr-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition sm:mr-2 ${
            loading
              ? "bg-slate-300 text-white cursor-not-allowed"
              : "bg-slate-100 hover:bg-slate-200 text-slate-600"
          }`}
          disabled={loading}
          aria-label="Attach file"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none"
            viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
            className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>

        {/* Voice mode toggle */}
        <button
          onClick={onToggleVoiceMode}
          type="button"
          className={`mr-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition sm:mr-2 ${
            voiceMode
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700"
              : "bg-slate-100 hover:bg-slate-200 text-slate-600"
          }`}
          aria-label={voiceMode ? "Disable voice mode" : "Enable voice mode"}
          title={voiceMode ? "Disable voice mode" : "Enable voice mode"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none"
            viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
            className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
          </svg>
        </button>

        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="mr-1 min-w-0 flex-grow resize-none overflow-y-auto border-none bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none sm:mr-2 sm:text-base"
          placeholder={
            voiceMode
              ? isSpeaking
                ? "AI is speaking..."
                : isRecording
                ? "Listening..."
                : "Voice mode active..."
              : selectedFile
              ? `Add a message about ${selectedFile.name}...`
              : "Type your message..."
          }
          disabled={loading}
        />

        <VoiceRecorder
          isRecording={isRecording}
          setIsRecording={setIsRecording}
          setInput={setInput}
          voiceMode={voiceMode}
          onAutoSend={onAutoSend}
          autoStartTrigger={autoStartTrigger}
          isSpeaking={isSpeaking}
        />

        {!loading ? (
          <button
            onClick={() => void sendMessage()}
            disabled={!input.trim() && !selectedFile}
            className={`absolute right-3 flex h-9 w-9 items-center justify-center rounded-full transition ${
              input.trim() || selectedFile
                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
            aria-label="Send message"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none"
              viewBox="0 0 24 24" strokeWidth={2}
              stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M5 12l14-7-4 7 4 7-14-7z" />
            </svg>
          </button>
        ) : (
          <button
            onClick={stopGenerating}
            className="absolute right-3 flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-white transition hover:bg-red-600"
            aria-label="Stop generation"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor"
              viewBox="0 0 24 24" className="w-3.5 h-3.5">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
