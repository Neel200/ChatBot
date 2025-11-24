// components/chat/ChatInput.tsx
"use client";

import React from "react";
import type { Dispatch, SetStateAction } from "react";

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
}: Props) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && (input.trim() || selectedFile)) {
      e.preventDefault();
      void sendMessage();
    }
  };

  return (
    <div className="w-full max-w-3xl mt-3 sm:mt-4 px-2">
      {selectedFile && (
        <div className="mb-2 flex items-center bg-white/80 backdrop-blur-md border border-gray-300 rounded-xl shadow-md p-2 max-w-full overflow-hidden">
          <span className="text-sm font-medium text-gray-700 truncate mr-2">
            Attached: {selectedFile.name}
          </span>
          <button
            onClick={removeSelectedFile}
            className="flex-shrink-0 w-5 h-5 ml-auto text-gray-500 hover:text-red-500 transition"
            aria-label="Remove attached file"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="relative flex items-center bg-white/80 backdrop-blur-md border border-gray-300 rounded-2xl shadow-md pl-3 pr-12 py-2 sm:py-3 focus-within:ring-2 focus-within:ring-indigo-400 transition">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*, application/pdf, text/*, .txt, .js, .ts, .jsx, .tsx, .css, .html, .py, .java, .c, .cpp, .json, .md, .csv, .doc, .docx"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full transition mr-2 ${
            loading ? "bg-gray-400 text-white cursor-not-allowed" : "bg-gray-200 hover:bg-gray-300 text-gray-600"
          }`}
          disabled={loading}
          aria-label="Attach file"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>

        <input
          type="text"
          name="message-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-grow bg-transparent border-none focus:outline-none text-gray-800 text-sm sm:text-base mr-2"
          placeholder={selectedFile ? `Add a message about ${selectedFile.name}...` : "Type your message..."}
          disabled={loading}
        />

        {!loading ? (
          <button
            onClick={() => void sendMessage()}
            disabled={!input.trim() && !selectedFile}
            className={`absolute right-3 flex items-center justify-center w-8 h-8 rounded-full transition ${
              input.trim() || selectedFile ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            aria-label="Send message"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l14-7-4 7 4 7-14-7z" />
            </svg>
          </button>
        ) : (
          <button
            onClick={stopGenerating}
            className="absolute right-3 flex items-center justify-center w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white transition"
            aria-label="Stop generation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-3.5 h-3.5">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}