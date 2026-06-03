"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import type { NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";

import ChatMessageBubble from "../components/chat/ChatMessageBubble";
import TypingBubble from "../components/chat/TypingBubble";
import LoadingDots from "../components/chat/LoadingDots";
import ChatInput from "../components/chat/ChatInput";
import ConversationList from "../components/sidebar/ConversationList";

import { fileToDataURL } from "../utils/chatUtils";
import { authFetch } from "../lib/authFetch";
import type { Message, ApiResponse } from "../components/types/chatTypes";

/* ================= TYPES ================= */

interface StoredMessage {
  _id: string;
  role: "user" | "bot";
  text: string;
  createdAt: string;
  file?: Message["file"];
}

//interface CreateConversationResponse {
//  id: string;
//}

/* ================= HELPERS ================= */

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

/* ================= PAGE ================= */

const ChatPage: NextPage = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [typingText, setTypingText] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const router = useRouter();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [conversationRefreshKey, setConversationRefreshKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingConversation, setLoadingConversation] = useState(false);

  /* ================= REFS ================= */

  const chatRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  //const creatingConversationRef = useRef(false);
  const hasLoadedConversationRef = useRef(false);

  /* ================= AUTH ================= */

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken || isTokenExpired(storedToken)) {
      localStorage.removeItem("token");
      router.replace("/login");
      return;
    }
    setToken(storedToken);
  }, [router]);

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    startNewChat();
    window.location.href = "/login";
  };

  /* ================= CONVERSATION ================= */

  const startNewChat = () => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);

    setConversationId(null);
    setMessages([]);
    setTypingText("");
    setLoading(false);
    setLoadingConversation(false);
    setSelectedFile(null);
    hasLoadedConversationRef.current = false;
  };

  const loadConversation = useCallback(
    async (id: string) => {
      if (!token) return;

      setLoadingConversation(true);
      try {
        const res = await authFetch(`/api/conversations/${id}`, token);

        if (!res.ok) return;

        const data = await res.json();
        setConversationId(id);

        setMessages(
          data.messages.map((m: StoredMessage) => ({
            _id: m._id,
            role: m.role,
            text: m.text,
            file: m.file,
          }))
        );

        hasLoadedConversationRef.current = true;
      } finally {
        setLoadingConversation(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (!conversationId || !token || hasLoadedConversationRef.current) return;
    loadConversation(conversationId);
  }, [conversationId, token, loadConversation]);

  /* ================= AUTOSAVE ================= */

  /*const saveMessage = useCallback(
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
  );*/

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
    (text: string, finalMessage?: Message) => {
      if (typingIntervalRef.current)
        clearInterval(typingIntervalRef.current);

      let current = "";
      let index = 0;
      setTypingText("");

      typingIntervalRef.current = setInterval(() => {
        if (!controllerRef.current) {
          clearInterval(typingIntervalRef.current!);

          if (current) {
            setMessages((p) => [
              ...p,
              finalMessage ? { ...finalMessage, text: current } : { role: "bot", text: current },
            ]);
            //void saveMessage(current, "bot");
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

          setMessages((p) => [...p, finalMessage ?? { role: "bot", text }]);
          //void saveMessage(text, "bot");

          setTypingText("");
          setLoading(false);
          controllerRef.current = null;
        }
      }, 25);
    },
    //[saveMessage]
    []
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


    const outgoingText = input.trim();
    const userMessage: Message = {
      role: "user",
      text: outgoingText || `Attached ${selectedFile?.name ?? "file"}`,
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
    //await saveMessage(userMessage.text, "user");

    const formData = new FormData();
    if (outgoingText) formData.append("message", outgoingText);
    if (selectedFile) formData.append("file", selectedFile);

    setInput("");
    setSelectedFile(null);
    setLoading(true);

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      if (conversationId) {
        formData.append("conversationId", conversationId);
      }

      
      const res = await authFetch("/api/chat", token, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error ?? `Server error ${res.status}`);
      }

      const data: ApiResponse = await res.json();
      
      if (!conversationId && data.conversationId) {
        hasLoadedConversationRef.current = true;
        setConversationId(data.conversationId);
      }

      const savedMessages = data.messages ?? [];
      const savedAssistantMessage =
        savedMessages[savedMessages.length - 1]?.role === "bot"
          ? savedMessages[savedMessages.length - 1]
          : undefined;

      if (savedMessages.length > 0) {
        const visibleMessages = savedAssistantMessage
          ? savedMessages.slice(0, -1)
          : savedMessages;

        setMessages(
          visibleMessages.map((message, index) => {
            const isLastUserMessage =
              index === visibleMessages.length - 1 && message.role === "user";

            return {
              ...message,
              file: isLastUserMessage
                ? userMessage.file ?? message.file
                : message.file,
            };
          })
        );
      }

      setConversationRefreshKey((key) => key + 1);

      typeEffect(
        savedAssistantMessage?.text ?? data.reply ?? "No response",
        savedAssistantMessage
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      const errMsg = `⚠️ ${msg}`;
      setMessages((p) => [...p, { role: "bot", text: errMsg }]);
      //void saveMessage(errMsg, "bot");
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
      //void saveMessage(typingText, "bot");
    }

    setTypingText("");
    setLoading(false);
  };

  /* ================= UI ================= */

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#f6f7fb] text-slate-950">
      {token && (
        <ConversationList
          token={token}
          activeConversationId={conversationId ?? undefined}
          refreshKey={conversationRefreshKey}
          isOpen={sidebarOpen}
          onNewChat={startNewChat}
          onClose={() => setSidebarOpen(false)}
          onSelect={(id) => {
            controllerRef.current?.abort();
            if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
            setConversationId(id);
            setMessages([]);
            setTypingText("");
            setLoading(false);
            setLoadingConversation(true);
            hasLoadedConversationRef.current = false;
          }}
          onConversationRemoved={(removedConversationId) => {
            if (removedConversationId === conversationId) {
              startNewChat();
            }
            setConversationRefreshKey((key) => key + 1);
          }}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_34%),linear-gradient(135deg,#f8fafc,#eef2ff_52%,#f8fafc)]">
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/75 px-3 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {token && !sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="h-4.5 w-4.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
            )}
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-200">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4.5 w-4.5">
                  <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5Z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-600">
                  ChatBot
                </p>
                <h1 className="truncate text-base font-semibold text-slate-950 sm:text-lg">
                  AI workspace
                </h1>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 text-sm font-medium sm:gap-3">
            {!token ? (
              <>
                <Link
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-md sm:px-4"
                  href="/login"
                >
                  Login
                </Link>
                <Link
                  className="rounded-full bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md sm:px-4"
                  href="/signup"
                >
                  Sign up
                </Link>
              </>
            ) : (
              <>
                <button
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-md sm:px-4"
                  onClick={startNewChat}
                  type="button"
                >
                  New chat
                </button>
                <button
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow-md sm:px-4"
                  onClick={logout}
                  type="button"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </header>

        <div className="flex-1 flex min-h-0 flex-col items-center justify-start overflow-hidden px-3 py-3 sm:px-6 sm:py-5">
          <div
            ref={chatRef}
            className={`w-full max-w-4xl rounded-[28px] border border-white/80 bg-white/70 p-3 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-6 ${
              messages.length > 0 ? "overflow-y-auto" : "overflow-hidden"
            } ${
              messages.length > 0 || loading
                ? "flex-1 min-h-0"
                : "h-[min(52dvh,520px)] flex-none sm:h-[min(56dvh,560px)]"
            }`}
          >
            {loadingConversation && (
              <div className="space-y-4 p-2 sm:p-4">
                {[70, 45, 85, 55].map((w, i) => (
                  <div key={i} className={`flex items-end gap-2 ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                    {i % 2 === 0 && (
                      <div className="mb-1 h-7 w-7 flex-shrink-0 rounded-full bg-slate-200 animate-pulse" />
                    )}
                    <div
                      className={`h-10 rounded-[22px] animate-pulse ${i % 2 === 0 ? "rounded-bl-md bg-slate-100" : "rounded-br-md bg-indigo-100"}`}
                      style={{ width: `${w}%`, maxWidth: "32rem" }}
                    />
                  </div>
                ))}
              </div>
            )}

            {messages.length === 0 && !loading && !loadingConversation && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-xl shadow-indigo-200">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
                    <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5Z" clipRule="evenodd" />
                  </svg>
                </div>
                <h1 className="max-w-xl text-2xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  What can I help with?
                </h1>
                <p className="mt-3 max-w-md text-sm leading-6 text-slate-500 sm:text-base">
                  Ask a question, attach a document, or continue a saved conversation.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {[
                    "Explain a complex topic simply",
                    "Write or review my code",
                    "Summarize a document",
                    "Help me brainstorm ideas",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setInput(suggestion)}
                      className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-md"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3 sm:space-y-4">
              {messages.map((m, i) => (
                <ChatMessageBubble key={m._id ?? i} message={m} index={i} />
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
