"use client";

import React from "react";
import MarkdownRenderer from "./MarkdownRenderer";

interface Props {
  typingText: string;
}

const BotAvatar = () => (
  <div className="mb-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm shadow-indigo-200">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
      <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5Z" clipRule="evenodd" />
    </svg>
  </div>
);

export default function TypingBubble({ typingText }: Props) {
  if (!typingText) return null;

  const startsWithCode = typingText.trim().startsWith("```");

  return (
    <div className="flex items-end gap-2 justify-start">
      <BotAvatar />
      <div className="max-w-[85%] rounded-[22px] rounded-bl-md border border-slate-200 bg-white p-3 text-sm leading-6 shadow-sm sm:max-w-2xl sm:p-4 sm:text-base">
        <div className="prose prose-sm sm:prose-base max-w-none text-slate-900">
          {startsWithCode ? (
            <div className="overflow-x-auto w-full">
              <pre className="whitespace-pre min-w-max rounded-lg p-4 bg-slate-900 text-slate-100 font-mono text-sm">
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
