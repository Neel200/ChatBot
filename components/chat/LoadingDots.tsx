// components/chat/LoadingDots.tsx
"use client";

import React from "react";

export default function LoadingDots() {
  return (
    <div className="flex justify-start">
      <div className="bg-white/90 text-gray-900 px-3 py-2 rounded-2xl shadow-sm">
        <div className="flex space-x-1">
          <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
          <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-.2s]"></span>
          <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-.4s]"></span>
        </div>
      </div>
    </div>
  );
}