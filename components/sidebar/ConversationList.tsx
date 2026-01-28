"use client";

import { useEffect, useState } from "react";

interface Conversation {
  _id: string;
  title: string;
  createdAt: string;
}

interface Props {
  token: string;
  activeConversationId?: string;
  onSelect: (conversationId: string) => void;
}

export default function ConversationList({
  token,
  activeConversationId,
  onSelect
}: Props){
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchConversations(): Promise<void> {
      try {
        const res = await fetch("/api/conversations", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) {
          setConversations([]);
          return;
        }

        const data: Conversation[] = await res.json();
        setConversations(data);
      } finally {
        setLoading(false);
      }
    }

    fetchConversations();
  }, [token]);

  if (loading) {
    return <div className="p-4 text-sm text-gray-500">Loading…</div>;
  }
  return (
    <aside className="w-64 border-r border-gray-700 overflow-y-auto">
      <div className="p-4 text-xs uppercase text-gray-400">
        Conversations
      </div>

      <ul>
        {conversations.map((conv) => (
          <li key={conv._id}>
            <button
              type="button"
              onClick={() => onSelect(conv._id)}
              className={`w-full text-left px-4 py-2 text-sm truncate ${
                conv._id === activeConversationId
                  ? "bg-gray-700 text-white"
                  : "hover:bg-gray-800 text-gray-300"
              }`}
            >
              {conv.title}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}