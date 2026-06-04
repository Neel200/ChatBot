"use client";

import { useEffect, useRef, useState } from "react";
import { authFetch } from "@/lib/authFetch";

interface Conversation {
  _id: string;
  title: string;
  createdAt: string;
  updatedAt?: string;
  archivedAt?: string | null;
}

interface Props {
  token: string;
  activeConversationId?: string;
  refreshKey?: number;
  isOpen: boolean;
  onNewChat: () => void;
  onClose: () => void;
  onSelect: (conversationId: string) => void;
  onConversationRemoved?: (conversationId: string) => void;
}

function userIdFromToken(token: string): string {
  try {
    return JSON.parse(atob(token.split(".")[1])).userId ?? "u";
  } catch {
    return "u";
  }
}

function readCache(key: string): Conversation[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Conversation[]) : [];
  } catch {
    return [];
  }
}

function writeCache(key: string, data: Conversation[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch { /* storage full — ignore */ }
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const SparkleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5Z" clipRule="evenodd" />
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

const DotsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path fillRule="evenodd" d="M4.5 12a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm6 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm6 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" clipRule="evenodd" />
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

export default function ConversationList({
  token,
  activeConversationId,
  refreshKey = 0,
  isOpen,
  onNewChat,
  onClose,
  onSelect,
  onConversationRemoved,
}: Props) {
  const cacheKey = `convlist_${userIdFromToken(token)}`;

  const [conversations, setConversations] = useState<Conversation[]>(() =>
    typeof window !== "undefined" ? readCache(cacheKey) : []
  );
  const [loading, setLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  // Entrance animation: hidden until main page settles, then slides in once
  const [mounted, setMounted] = useState(false);
  const [animDone, setAnimDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 320);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    isFetchingRef.current = true;

    const fetchConversations = async () => {
      setLoading(true);

      try {
        const res = await authFetch("/api/conversations", token);

        if (!res.ok) {
          if (!cancelled) setConversations([]);
          return;
        }

        const data: Conversation[] = await res.json();
        if (!cancelled) {
          setConversations(data);
          writeCache(cacheKey, data);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          isFetchingRef.current = false;
        }
      }
    };

    fetchConversations();

    return () => {
      cancelled = true;
    };
  }, [token, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const removeConversationFromList = (conversationId: string) => {
    setConversations((current) =>
      current.filter((conversation) => conversation._id !== conversationId)
    );
    setOpenMenuId(null);
    onConversationRemoved?.(conversationId);
  };

  const archiveConversation = async (conversationId: string) => {
    const res = await authFetch(`/api/conversations/${conversationId}`, token, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "archive" }),
    });

    if (res.ok) removeConversationFromList(conversationId);
  };

  const deleteConversation = async (conversationId: string) => {
    const confirmed = window.confirm("Delete this chat permanently?");
    if (!confirmed) return;

    const res = await authFetch(`/api/conversations/${conversationId}`, token, {
      method: "DELETE",
    });

    if (res.ok) removeConversationFromList(conversationId);
  };

  const entranceClass = !mounted ? "opacity-0" : !animDone ? "animate-sidebar-in" : "";

  const sidebarClasses = `fixed inset-y-0 left-0 z-40 flex w-[min(18rem,86vw)] shrink-0 flex-col border-r border-white/10 bg-slate-950 text-white shadow-2xl transition-all duration-300 md:relative md:shadow-none ${
    isOpen
      ? "translate-x-0 md:w-72"
      : "-translate-x-full md:w-0 md:overflow-hidden md:border-r-0"
  } ${entranceClass}`;

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-slate-950/35 backdrop-blur-sm md:hidden"
        />
      )}

      <aside className={sidebarClasses} onAnimationEnd={() => setAnimDone(true)}>
        <div className="border-b border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-950/40">
              <SparkleIcon />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">ChatBot</p>
              <p className="text-xs text-slate-400">AI assistant</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close sidebar"
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <XIcon />
            </button>
          </div>

          <button
            type="button"
            onClick={onNewChat}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            <PlusIcon />
            New chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {loading && conversations.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.15s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          ) : (
            <>
              <div className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Conversations
              </div>

              {conversations.length === 0 ? (
                <p className="rounded-xl border border-white/10 px-3 py-4 text-sm leading-6 text-slate-400">
                  Your saved chats will appear here.
                </p>
              ) : (
                <ul className="space-y-1">
                  {conversations.map((conv) => (
                    <li key={conv._id} className="group relative">
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(conv._id);
                          onClose();
                        }}
                        className={`w-full rounded-xl py-2.5 pl-3 pr-11 text-left text-sm transition ${
                          conv._id === activeConversationId
                            ? "bg-indigo-500/90 text-white shadow-lg shadow-indigo-950/25"
                            : "text-slate-300 hover:bg-white/8 hover:text-white"
                        }`}
                      >
                        <span className="block truncate font-medium">{conv.title}</span>
                        <span className={`mt-0.5 block text-xs ${
                          conv._id === activeConversationId ? "text-indigo-200" : "text-slate-500"
                        }`}>
                          {relativeTime(conv.updatedAt ?? conv.createdAt)}
                        </span>
                      </button>

                      <button
                        type="button"
                        aria-label={`Open actions for ${conv.title}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenMenuId((current) =>
                            current === conv._id ? null : conv._id
                          );
                        }}
                        className={`absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full transition ${
                          conv._id === activeConversationId
                            ? "text-white/70 hover:bg-white/15 hover:text-white"
                            : "text-slate-500 opacity-0 group-hover:opacity-100 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <DotsIcon />
                      </button>

                      {openMenuId === conv._id && (
                        <div className="absolute right-2 top-12 z-50 w-36 overflow-hidden rounded-xl border border-white/10 bg-slate-900 py-1 shadow-xl">
                          <button
                            type="button"
                            onClick={() => archiveConversation(conv._id)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/10"
                          >
                            Archive
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteConversation(conv._id)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 transition hover:bg-red-500/15 hover:text-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
}
