import fs from "fs";
import type { File } from "formidable";
import type { FileContentPart } from "@/components/types/chatTypes";

export function buildFileContent(file: File): FileContentPart[] {
  const mime = file.mimetype || "";

  // IMAGE FILE
  if (mime.startsWith("image/")) {
    const base64 = fs.readFileSync(file.filepath).toString("base64");
    const url = `data:${mime};base64,${base64}`;

    return [
      {
        type: "image_url",
        image_url: { url }
      }
    ];
  }

  // TEXT or OTHER FILE
  const text = fs.readFileSync(file.filepath, "utf8");

  return [
    {
      type: "text",
      text
    }
  ];
}