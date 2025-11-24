// components/chat/TypingBubble.tsx
"use client";

import React from "react";
import MarkdownRenderer from "./MarkdownRenderer";

interface Props {
  typingText: string;
}

export default function TypingBubble({ typingText }: Props) {
  if (!typingText) return null;

  const startsWithCode = typingText.trim().startsWith("```");

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] sm:max-w-xl p-2 sm:p-3 rounded-2xl bg-white/90 text-gray-900 rounded-bl-none shadow-sm">
        <div className="prose prose-sm sm:prose-base max-w-none">
          {startsWithCode ? (
            <div className="overflow-x-auto w-full">
              <pre className="whitespace-pre min-w-max rounded-lg p-4 bg-black/80 text-white font-mono text-sm">
                <code>{typingText + "▋"}</code>
              </pre>
            </div>
          ) : (
            <MarkdownRenderer text={`${typingText}▋`} />
          )}
        </div>
      </div>
    </div>
  );
}