This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [https://chat-bot-git-main-neel200s-projects.vercel.app/](https://chat-bot-git-main-neel200s-projects.vercel.app/) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!


<img width="1024" height="1536" alt="chat-architecture png" src="https://github.com/user-attachments/assets/49e528fc-75d0-4249-bd61-e0e958f5887c" />

## Chat Persistence Model

Saved chats use a parent-child MongoDB structure:

- `Conversation` is the saved chat/thread shown in the sidebar. It belongs to one `User` through `userId` and stores the chat title, archive state, and timestamps.
- `Message` is one item inside a saved chat. Every message stores `conversationId`, `role`, `content`, optional file metadata, and timestamps.

The frontend flow should match ChatGPT-style history:

1. `POST /api/chat` creates a new `Conversation` when no `conversationId` is sent, or appends to the existing conversation when `conversationId` is present.
2. The backend saves the user message and assistant message under the same `conversationId`.
3. The backend returns the full saved message list for that conversation.
4. `GET /api/conversations` loads the sidebar list of saved chats.
5. `GET /api/conversations/:id` loads the full message history for one selected chat.
6. `PATCH /api/conversations/:id` archives or unarchives a chat.
7. `DELETE /api/conversations/:id` permanently deletes a chat and its child messages.

Conversation titles are generated after the first assistant reply, so the sidebar shows useful task-style titles instead of simply copying the user's first message.

Authentication is currently JWT-based. The frontend stores the JWT in `localStorage` and sends it as an `Authorization: Bearer <token>` header, so protected API middleware must accept that header when loading saved conversations.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
