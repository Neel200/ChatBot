// pages/index.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import type { NextPage } from "next";
//import MarkdownRenderer from "../components/chat/MarkdownRenderer";
import ChatMessageBubble from "../components/chat/ChatMessageBubble";
import TypingBubble from "../components/chat/TypingBubble";
import LoadingDots from "../components/chat/LoadingDots";
import ChatInput from "../components/chat/ChatInput";
import { fileToDataURL } from "../utils/chatUtils";
import type { Message, ApiResponse } from "../components/types/chatTypes";

const ChatPage: NextPage = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const chatRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const chat = chatRef.current;
    if (!chat) return;

    // Scroll to bottom if near the bottom
    const isNearBottom = chat.scrollHeight - chat.scrollTop - chat.clientHeight < 150;

    if (isNearBottom) {
      requestAnimationFrame(() => {
        if (chat) chat.scrollTop = chat.scrollHeight;
      });
    }
  }, [messages, typingText]);

  const typeEffect = useCallback((text: string) => {
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);

    let currentText = "";
    let i = 0;

    controllerRef.current = controllerRef.current ?? new AbortController();
    setTypingText("");

    typingIntervalRef.current = setInterval(() => {
      if (!controllerRef.current) {
        clearInterval(typingIntervalRef.current!);
        setMessages((prev) => [...prev, { role: "bot", text: currentText }]);
        setTypingText("");
        setLoading(false);
        return;
      }

      if (i < text.length) {
        currentText += text[i];
        setTypingText(currentText);
        i++;
      } else {
        clearInterval(typingIntervalRef.current!);

        setMessages((prev) => [...prev, { role: "bot", text }]);
        setTypingText("");
        setLoading(false);
        controllerRef.current = null;
      }
    }, 25);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      (e.target.form?.elements.namedItem("message-input") as HTMLInputElement | null)?.focus();
    }
    e.target.value = "";
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
  };

  const sendMessage = async () => {
    if ((!input.trim() && !selectedFile) || loading) return;

    const userMessage: Message = { role: "user", text: input };

    if (selectedFile) {
      const dataURL = await fileToDataURL(selectedFile);
      userMessage.file = {
        name: selectedFile.name,
        url: dataURL,
        mimeType: selectedFile.type,
      };
    }

    setMessages((prev) => [...prev, userMessage]);

    const formData = new FormData();
    if (input.trim()) {
      formData.append("message", input);
    }
    if (selectedFile) {
      formData.append("file", selectedFile);
    }

    setInput("");
    setSelectedFile(null);
    setLoading(true);

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: ApiResponse = await res.json();
      typeEffect(data.reply ?? "No response from the model.");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        if (typingText) {
          setMessages((prev) => [...prev, { role: "bot", text: typingText }]);
          setTypingText("");
        } else {
          setMessages((prev) => [...prev, { role: "bot", text: "⏹️ Generation stopped." }]);
        }
      } else {
        console.error("Error:", err);
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: "⚠️ Something went wrong. Please try again." },
        ]);
      }

      setLoading(false);
      controllerRef.current = null;
    }
  };

  const stopGenerating = () => {
    controllerRef.current?.abort();
    controllerRef.current = null;

    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);

    if (typingText) {
      setMessages((prev) => [...prev, { role: "bot", text: typingText }]);
    }

    setTypingText("");
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-500 pb-4 sm:pb-6">
      <div className="flex-1 flex flex-col items-center justify-center overflow-hidden px-2 sm:px-4 py-4 sm:py-6">
        <div
          ref={chatRef}
          className={`w-full max-w-3xl flex-1 min-h-0 bg-white/15 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20
            ${messages.length > 0 ? "overflow-y-auto scroll-smooth" : "overflow-hidden"}
             p-3 sm:p-6`}
          style={{
            WebkitOverflowScrolling: messages.length > 0 ? "touch" : "auto",
            overscrollBehavior: messages.length > 0 ? "contain" : "auto",
          }}
        >
          {messages.length === 0 && !loading && (
            <div
              className="flex flex-col justify-center items-center h-[70vh] text-center space-y-3 sm:space-y-4 
              opacity-0 translate-y-4 animate-[fadeSlideUp_1s_ease-out_forwards]"
            >
              <h1 className="text-2xl sm:text-3xl font-semibold text-white drop-shadow-lg">
                Start chatting with Gemini 🤖
              </h1>

              <p className="text-gray-200 text-sm sm:text-base opacity-0 animate-[fadeIn_1.2s_ease-out_0.3s_forwards]">
                Type a message or attach a file below to begin.
              </p>
            </div>
          )}


          <div className="space-y-3 sm:space-y-4">
            {messages.map((m, i) => (
              <ChatMessageBubble key={i} message={m} index={i} />
            ))}

            {typingText && <TypingBubble typingText={typingText} />}

            {loading && !typingText && <LoadingDots />}
          </div>
        </div>

        <ChatInput
          input={input}
          setInput={setInput}
          sendMessage={sendMessage}
          loading={loading}
          stopGenerating={stopGenerating}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          fileInputRef={fileInputRef}
          handleFileChange={handleFileChange}
          removeSelectedFile={removeSelectedFile}
        />
      </div>
    </div>
  );
};

export default ChatPage;
