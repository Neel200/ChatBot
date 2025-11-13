"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import type { SyntaxHighlighterProps } from "react-syntax-highlighter";

type Role = "user" | "bot";
interface Message { role: Role; text: string; }
interface ApiResponse { reply?: string; }

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [typingText, setTypingText] = useState("");

  const chatRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const chat = chatRef.current;
    if (!chat) return;
    const isNearBottom = chat.scrollHeight - chat.scrollTop - chat.clientHeight < 150;
    if (isNearBottom) {
      requestAnimationFrame(() => { chat.scrollTop = chat.scrollHeight; });
    }
  }, [messages, typingText]);

  const typeEffect = (text: string) => {
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    let currentText = ""; let i = 0;
    controllerRef.current = controllerRef.current ?? new AbortController();
    setTypingText("");

    typingIntervalRef.current = setInterval(() => {
      if (!controllerRef.current) {
        clearInterval(typingIntervalRef.current!);
        setMessages((prev) => [...prev, { role: "bot", text: currentText }]);
        setTypingText(""); setLoading(false); return;
      }
      if (i < text.length) {
        currentText += text[i]; setTypingText(currentText); i++;
      } else {
        clearInterval(typingIntervalRef.current!);
        setMessages((prev) => [...prev, { role: "bot", text }]);
        setTypingText(""); setLoading(false); controllerRef.current = null;
      }
    }, 25);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage: Message = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput(""); setLoading(true);
    const controller = new AbortController(); controllerRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.text }),
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
        setMessages((prev) => [...prev, { role: "bot", text: "⚠️ Something went wrong. Please try again." }]);
      }
      setLoading(false); controllerRef.current = null;
    }
  };

  const stopGenerating = () => {
    controllerRef.current?.abort(); controllerRef.current = null;
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    if (typingText) setMessages((prev) => [...prev, { role: "bot", text: typingText }]);
    setTypingText(""); setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input.trim()) sendMessage();
  };

  const MarkdownRenderer = ({ text }: { text: string }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = (code: string) => {
      navigator.clipboard.writeText(code);
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    };

    const components: Components = {
      code({
        inline, className, children, ...props
      }: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { inline?: boolean }) {
        const match = /language-(\w+)/.exec(className ?? "");
        if (!inline && match) {
          const codeString = String(children).replace(/\n$/, "");
          return (
            <div className="relative group my-2">
              <button
                onClick={() => handleCopy(codeString)}
                className="absolute top-2 right-2 bg-gray-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
              <SyntaxHighlighter
                style={oneDark}
                language={match[1]}
                PreTag="div"
                customStyle={{
                  borderRadius: "0.75rem",
                  padding: "1rem",
                  background: "rgba(0,0,0,0.9)",
                  fontSize: "0.85rem",
                  overflowX: "auto",
                  whiteSpace: "pre-wrap",
                }}
                {...(props as SyntaxHighlighterProps)}
              >
                {codeString}
              </SyntaxHighlighter>
            </div>
          );
        }
        return (
          <code className="bg-gray-200 text-pink-600 px-1 py-0.5 rounded font-mono text-sm" {...props}>
            {children}
          </code>
        );
      },
    };

    return (
      <div className="overflow-x-auto max-w-full">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {text}
        </ReactMarkdown>
      </div>
    );

  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-500 pb-4 sm:pb-6">
      {/* Chat Container */}
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
            <div className="flex flex-col justify-center items-center h-[70vh] text-center space-y-3 sm:space-y-4">
              <h1 className="text-2xl sm:text-3xl font-semibold text-white drop-shadow-lg">
                Start chatting with Gemini 🤖
              </h1>
              <p className="text-gray-200 text-sm sm:text-base">Type a message below to begin.</p>
            </div>
          )}

          <div className="space-y-3 sm:space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] sm:max-w-xl p-2 sm:p-3 rounded-2xl shadow-sm break-words ${
                    m.role === "user"
                      ? "bg-indigo-500 text-white rounded-br-none"
                      : "bg-white/90 text-gray-900 rounded-bl-none"
                  }`}
                >
                  <div className="prose prose-sm sm:prose-base max-w-none">
                    <MarkdownRenderer text={m.text} />
                  </div>
                </div>
              </div>
            ))}

            {typingText && (
              <div className="flex justify-start">
                <div className="max-w-[85%] sm:max-w-xl p-2 sm:p-3 rounded-2xl bg-white/90 text-gray-900 rounded-bl-none shadow-sm">
                  <div className="prose prose-sm sm:prose-base max-w-none">
                    <MarkdownRenderer text={`${typingText}▋`} />
                  </div>
                </div>
              </div>
            )}

            {loading && !typingText && (
              <div className="flex justify-start">
                <div className="bg-white/90 text-gray-900 px-3 py-2 rounded-2xl shadow-sm">
                  <div className="flex space-x-1">
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-.2s]"></span>
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-.4s]"></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area (ChatGPT-style) */}
        <div className="w-full max-w-3xl mt-3 sm:mt-4 px-2">
          <div className="relative flex items-center bg-white/80 backdrop-blur-md border border-gray-300 rounded-2xl shadow-md px-3 py-2 sm:py-3 focus-within:ring-2 focus-within:ring-indigo-400 transition">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-grow bg-transparent border-none focus:outline-none text-gray-800 text-sm sm:text-base pr-12"
              placeholder="Type your message..."
            />

            {/* Send / Stop buttons */}
            {!loading ? (
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                className={`absolute right-3 flex items-center justify-center w-8 h-8 rounded-full transition ${
                  input.trim()
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {/* Send Icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l14-7-4 7 4 7-14-7z" />
                </svg>
              </button>
            ) : (
              <button
                onClick={stopGenerating}
                className="absolute right-3 flex items-center justify-center w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white transition"
              >
                {/* Stop (square) icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="w-3.5 h-3.5"
                >
                  <rect x="6" y="6" width="12" height="12" rx="1" />
                </svg>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}