"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import type { NextPage } from "next";
import Link from "next/link";

import ChatMessageBubble from "../components/chat/ChatMessageBubble";
import TypingBubble from "../components/chat/TypingBubble";
import LoadingDots from "../components/chat/LoadingDots";
import ChatInput from "../components/chat/ChatInput";
import ConversationList from "../components/sidebar/ConversationList";

import { fileToDataURL } from "../utils/chatUtils";
import type { Message, ApiResponse } from "../components/types/chatTypes";

/* ================= TYPES ================= */

interface StoredMessage {
  _id: string;
  role: "user" | "bot";
  text: string;
  createdAt: string;
}

interface CreateConversationResponse {
  id: string;
}

/* ================= PAGE ================= */

const ChatPage: NextPage = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [typingText, setTypingText] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  /* ================= REFS ================= */

  const chatRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const creatingConversationRef = useRef(false);
  const hasLoadedConversationRef = useRef(false);

  /* ================= AUTH ================= */

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) setToken(storedToken);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    startNewChat();
    window.location.href = "/login";
  };

  /* ================= CONVERSATION ================= */

  const startNewChat = () => {
    setConversationId(null);
    setMessages([]);
    setTypingText("");
    hasLoadedConversationRef.current = false;
  };

  const loadConversation = useCallback(
    async (id: string) => {
      if (!token) return;

      const res = await fetch(`/api/conversations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;

      const data = await res.json();

      setMessages(
        data.messages.map((m: StoredMessage) => ({
          role: m.role,
          text: m.text,
        }))
      );


      hasLoadedConversationRef.current = true;
    },
    [token]
  );

  useEffect(() => {
    if (!conversationId || !token || hasLoadedConversationRef.current) return;
    loadConversation(conversationId);
  }, [conversationId, token, loadConversation]);

  /* ================= AUTOSAVE ================= */

  const saveMessage = useCallback(
    async (text: string, role: "user" | "bot") => {
      if (!conversationId || !token) return;

      try {
        await fetch(`/api/conversations/${conversationId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text, role }),
        });
      } catch (err) {
        console.error("Autosave failed", err);
      }
    },
    [conversationId, token]
  );

  /* ================= AUTO SCROLL ================= */

  useEffect(() => {
    const chat = chatRef.current;
    if (!chat) return;

    const isNearBottom =
      chat.scrollHeight - chat.scrollTop - chat.clientHeight < 150;

    if (isNearBottom) {
      requestAnimationFrame(() => {
        chat.scrollTop = chat.scrollHeight;
      });
    }
  }, [messages, typingText]);

  /* ================= TYPING EFFECT ================= */

  const typeEffect = useCallback(
    (text: string) => {
      if (typingIntervalRef.current)
        clearInterval(typingIntervalRef.current);

      let current = "";
      let index = 0;
      setTypingText("");

      typingIntervalRef.current = setInterval(() => {
        if (!controllerRef.current) {
          clearInterval(typingIntervalRef.current!);

          if (current) {
            setMessages((p) => [...p, { role: "bot", text: current }]);
            void saveMessage(current, "bot");
          }

          setTypingText("");
          setLoading(false);
          return;
        }

        if (index < text.length) {
          current += text[index++];
          setTypingText(current);
        } else {
          clearInterval(typingIntervalRef.current!);

          setMessages((p) => [...p, { role: "bot", text: text }]);
          void saveMessage(text, "bot");

          setTypingText("");
          setLoading(false);
          controllerRef.current = null;
        }
      }, 25);
    },
    [saveMessage]
  );

  /* ================= FILE ================= */

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    e.target.value = "";
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
  };

  /* ================= SEND MESSAGE ================= */

  const sendMessage = async () => {
    if ((!input.trim() && !selectedFile) || loading) return;
    if (!token) return alert("Please log in");

    let activeConversationId = conversationId;

    if (!activeConversationId && !creatingConversationRef.current) {
      creatingConversationRef.current = true;

      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data: CreateConversationResponse = await res.json();
      activeConversationId = data.id;
      setConversationId(data.id);

      creatingConversationRef.current = false;
    }

    const userMessage: Message = {
      role: "user",
      text: input,
    };

    if (selectedFile) {
      const dataURL = await fileToDataURL(selectedFile);
      userMessage.file = {
        name: selectedFile.name,
        url: dataURL,
        mimeType: selectedFile.type,
      };
    }

    setMessages((p) => [...p, userMessage]);
    await saveMessage(userMessage.text, "user");

    const formData = new FormData();
    if (input.trim()) formData.append("message", input);
    if (selectedFile) formData.append("file", selectedFile);

    setInput("");
    setSelectedFile(null);
    setLoading(true);

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      if (activeConversationId) {
        formData.append("conversationId", activeConversationId);
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
        signal: controller.signal,
      });

      if (!res.ok) throw new Error();

      const data: ApiResponse = await res.json();
      typeEffect(data.reply ?? "No response");
    } catch {
      const errMsg = "⚠️ Something went wrong.";
      setMessages((p) => [...p, { role: "bot", text: errMsg }]);
      void saveMessage(errMsg, "bot");
      setLoading(false);
    }
  };

  /* ================= STOP ================= */

  const stopGenerating = () => {
    controllerRef.current?.abort();
    controllerRef.current = null;

    if (typingIntervalRef.current)
      clearInterval(typingIntervalRef.current);

    if (typingText) {
      setMessages((p) => [...p, { role: "bot", text: typingText }]);
      void saveMessage(typingText, "bot");
    }

    setTypingText("");
    setLoading(false);
  };

  /* ================= UI ================= */

  return (
    <div className="flex h-screen">
      {token && (
        <ConversationList
          token={token}
          activeConversationId={conversationId ?? undefined}
          onSelect={(id) => {
            setConversationId(id);
            setMessages([]);
            hasLoadedConversationRef.current = false;
          }}
        />
      )}

      <div className="flex-1 flex flex-col bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-500 pb-4 sm:pb-6">
        <div className="flex-1 flex flex-col items-center justify-center overflow-hidden px-2 sm:px-4 py-4 sm:py-6">
          <div
            ref={chatRef}
            className={`w-full max-w-3xl flex-1 min-h-0 bg-white/15 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-3 sm:p-6 ${
              messages.length > 0 ? "overflow-y-auto" : "overflow-hidden"
            }`}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-2 text-sm text-white/80">
              <div>{token && <button onClick={startNewChat}>New chat</button>}</div>

              <div className="flex gap-3">
                {!token ? (
                  <>
                    <Link href="/login">Login</Link>
                    <Link href="/signup">Signup</Link>
                  </>
                ) : (
                  <button onClick={logout}>Logout</button>
                )}
              </div>
            </div>

            {/* Empty state */}
            {messages.length === 0 && !loading && (
              <div className="flex flex-col justify-center items-center h-[70vh] text-center space-y-4
                opacity-0 translate-y-4 animate-[fadeSlideUp_1s_ease-out_forwards]">
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
            handleFileChange={handleFileChange}
            removeSelectedFile={removeSelectedFile}
            isRecording={isRecording}
            setIsRecording={setIsRecording}
            fileInputRef={fileInputRef}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;