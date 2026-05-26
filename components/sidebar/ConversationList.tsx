"use client";

import { useEffect, useState } from "react";

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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    const fetchConversations = async () => {
      setLoading(true);

      try {
        const res = await fetch("/api/conversations", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          if (!cancelled) setConversations([]);
          return;
        }

        const data: Conversation[] = await res.json();
        if (!cancelled) setConversations(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchConversations();

    return () => {
      cancelled = true;
    };
  }, [token, refreshKey]);

  const removeConversationFromList = (conversationId: string) => {
    setConversations((current) =>
      current.filter((conversation) => conversation._id !== conversationId)
    );
    setOpenMenuId(null);
    onConversationRemoved?.(conversationId);
  };

  const archiveConversation = async (conversationId: string) => {
    const res = await fetch(`/api/conversations/${conversationId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: "archive" }),
    });

    if (res.ok) removeConversationFromList(conversationId);
  };

  const deleteConversation = async (conversationId: string) => {
    const confirmed = window.confirm("Delete this chat permanently?");
    if (!confirmed) return;

    const res = await fetch(`/api/conversations/${conversationId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) removeConversationFromList(conversationId);
  };

  if (loading) {
    return (
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[min(18rem,86vw)] shrink-0 border-r border-slate-200 bg-slate-950 p-4 text-sm text-slate-400 shadow-2xl transition-all duration-300 md:relative md:shadow-none ${
          isOpen
            ? "translate-x-0 md:w-72"
            : "-translate-x-full md:w-0 md:overflow-hidden md:border-r-0"
        }`}
      >
        Loading...
      </aside>
    );
  }

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

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[min(18rem,86vw)] shrink-0 flex-col border-r border-slate-200 bg-slate-950 text-white shadow-2xl transition-all duration-300 md:relative md:shadow-none ${
          isOpen
            ? "translate-x-0 md:w-72"
            : "-translate-x-full md:w-0 md:overflow-hidden md:border-r-0"
        }`}
      >
      <div className="border-b border-white/10 p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500 font-bold shadow-lg shadow-indigo-950/30">
            C
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">ChatBot</p>
            <p className="text-xs text-slate-400">MERN AI assistant</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="grid h-9 w-9 place-items-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            x
          </button>
        </div>

        <button
          type="button"
          onClick={onNewChat}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-white/80 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-md"
        >
          <span className="text-lg leading-none">+</span>
          New chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
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
                  className={`w-full rounded-xl py-3 pl-3 pr-11 text-left text-sm transition ${
                    conv._id === activeConversationId
                      ? "bg-indigo-500 text-white shadow-lg shadow-indigo-950/25"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="block truncate font-medium">{conv.title}</span>
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
                  className={`absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-sm transition ${
                    conv._id === activeConversationId
                      ? "text-white/80 hover:bg-white/15 hover:text-white"
                      : "text-slate-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  ...
                </button>

                {openMenuId === conv._id && (
                  <div className="absolute right-2 top-11 z-50 w-32 overflow-hidden rounded-lg border border-white/10 bg-slate-900 py-1 text-sm shadow-xl">
                    <button
                      type="button"
                      onClick={() => archiveConversation(conv._id)}
                      className="block w-full px-3 py-2 text-left text-slate-200 transition hover:bg-white/10 hover:text-white"
                    >
                      Archive
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteConversation(conv._id)}
                      className="block w-full px-3 py-2 text-left text-red-300 transition hover:bg-red-500/15 hover:text-red-200"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      </aside>
    </>
  );
}
