// components/chat/MarkdownRenderer.tsx
"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import type { SyntaxHighlighterProps } from "react-syntax-highlighter";
import { cleanMarkdown } from "../../utils/chatUtils";

interface Props {
  text: string;
}

export default function MarkdownRenderer({ text }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const components: Components = {
    code({
      inline,
      className,
      children,
      ...props
    }: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      inline?: boolean;
    }) {
      const match = /language-(\w+)/.exec(className ?? "");

      if (!inline && match) {
        const codeString = String(children).replace(/\n$/, "");
        return (
          <div className="relative group my-2">
            <button
              onClick={() => handleCopy(codeString)}
              className="absolute top-2 right-2 bg-gray-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10"
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
                whiteSpace: "pre",
              }}
              {...(props as SyntaxHighlighterProps)}
            >
              {codeString}
            </SyntaxHighlighter>
          </div>
        );
      }

      return (
        <code className="text-pink-600 px-1 py-0.5 rounded font-mono text-sm" {...props}>
          {children}
        </code>
      );
    },
  };

  return (
    <div className="overflow-x-auto max-w-full">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {cleanMarkdown(text)}
      </ReactMarkdown>
    </div>
  );
}