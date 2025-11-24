// components/chat/FileAttachmentPreview.tsx
/*"use client";

import React from "react";
import type { FileData } from "../types/chatTypes";

interface Props {
  file?: FileData | null;
}

export default function FileAttachmentPreview({ file }: Props) {
  if (!file) return null;

  const isImage = file.mimeType.startsWith("image/");
  const isPDF = file.mimeType === "application/pdf";
  const isText = file.mimeType.startsWith("text/") || isPDF;

  if (isImage) {
    return (
      <img
        src={file.url}
        alt={file.name}
        className="max-h-48 rounded-lg object-contain mt-2"
      />
    );
  }

  return (
    <div className="mt-2 p-2 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-700 font-mono overflow-auto max-h-32">
      <strong>File:</strong> {file.name}
      <br />
      <span className="text-xs text-gray-500">
        ({isPDF ? "PDF Document" : isText ? "Text/Code File" : file.mimeType})
      </span>
    </div>
  );
}*/
// components/chat/FileAttachmentPreview.tsx
"use client";

import React from "react";
import Image from "next/image";
import type { FileData } from "../types/chatTypes";

interface Props {
  file?: FileData | null;
}

export default function FileAttachmentPreview({ file }: Props) {
  if (!file) return null;

  const isImage = file.mimeType.startsWith("image/");
  const isPDF = file.mimeType === "application/pdf";
  const isText = file.mimeType.startsWith("text/") || isPDF;

  if (isImage) {
    return (
      <div className="relative w-full max-w-sm h-48 mt-2">
        <Image
          src={file.url}
          alt={file.name}
          fill
          unoptimized
          className="object-contain rounded-lg"
        />
      </div>
    );
  }

  return (
    <div className="mt-2 p-2 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-700 font-mono overflow-auto max-h-32">
      <strong>File:</strong> {file.name}
      <br />
      <span className="text-xs text-gray-500">
        ({isPDF ? "PDF Document" : isText ? "Text/Code File" : file.mimeType})
      </span>
    </div>
  );
}