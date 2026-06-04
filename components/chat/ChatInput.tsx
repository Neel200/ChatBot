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
    <div className="w-full max-w-4xl mt-2 px-0 sm:mt-4 sm:px-1 animate-slide-up" style={{ animationDelay: "0.2s" }}>
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

      <div className="relative flex items-center rounded-[24px] border border-slate-200 bg-white/95 py-2 pl-2 pr-24 shadow-[0_18px_50px_rgba(15,23,42,0.14)] backdrop-blur-md transition focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-100 sm:py-3 sm:pl-3">

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*, application/pdf, text/*, .txt, .js, .ts, .jsx, .tsx, .css, .html, .py, .java, .c, .cpp, .json, .md, .csv, .doc, .docx"
        />

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

        {/* 🔥 INPUT → TEXTAREA (auto expanding) */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="mr-1 min-w-0 flex-grow resize-none overflow-y-auto border-none bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none sm:mr-2 sm:text-base"
          placeholder={
            selectedFile
              ? `Add a message about ${selectedFile.name}...`
              : "Type your message..."
          }
          disabled={loading}
        />

        <VoiceRecorder
          isRecording={isRecording}
          setIsRecording={setIsRecording}
          setInput={setInput}
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
