// components/chat/ChatMessageBubble.tsx
"use client";

import React from "react";
import MarkdownRenderer from "./MarkdownRenderer";
import FileAttachmentPreview from "./FileAttachmentPreview";
import type { Message as MessageType } from "../types/chatTypes";

interface Props {
  message: MessageType;
  index: number;
}

export default function ChatMessageBubble({ message, index }: Props) {
  return (
    <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`} key={index}>
      <div
        className={`max-w-[88%] break-words rounded-[22px] p-3 text-sm leading-6 shadow-sm sm:max-w-2xl sm:p-4 sm:text-base ${
          message.role === "user"
            ? "rounded-br-md bg-indigo-600 text-white shadow-indigo-200"
            : "rounded-bl-md border border-slate-200 bg-white text-slate-900"
        }`}
      >
        {message.file && (
          <div className="mb-2">
            <FileAttachmentPreview file={message.file} />
          </div>
        )}
        <div className="prose prose-sm sm:prose-base max-w-none">
          <MarkdownRenderer text={message.text} />
        </div>
      </div>
    </div>
  );
}
