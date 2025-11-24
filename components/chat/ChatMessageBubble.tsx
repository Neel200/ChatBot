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
        className={`max-w-[85%] sm:max-w-xl p-2 sm:p-3 rounded-2xl shadow-sm break-words ${
          message.role === "user"
            ? "bg-indigo-500 text-white rounded-br-none"
            : "bg-white/90 text-gray-900 rounded-bl-none"
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