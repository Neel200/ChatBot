import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";

// ⚠️ IMPORTANT: Disable Next.js body parser to handle multipart/form-data
export const config = {
    api: {
        bodyParser: false,
    },
};

// --- Type Definitions for Azure OpenAI Vision API ---

type TextContent = {
    type: "text";
    text: string;
};

type ImageUrlContent = {
    type: "image_url";
    image_url: {
        url: string; // Base64 Data URL
    };
};

type MessageContent = TextContent | ImageUrlContent;

type ChatMessage = {
    role: "user";
    content: MessageContent[];
};

// --- Utility Functions ---

/**
 * Converts a local file path to a base64 data URL.
 * Used for images.
 */
function fileToBase64(filePath: string, mimeType: string): string {
    const fileBuffer = fs.readFileSync(filePath);
    return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
}

/**
 * Reads a local file's content as a string.
 * Used for text/code/PDF files.
 */
function fileToText(filePath: string): string {
    // For text and code files, read as UTF-8 string
    const textContent = fs.readFileSync(filePath, 'utf-8');
    return textContent;
}

/**
 * Helper to check if a MIME type is an image.
 */
function isImageMimeType(mimeType: string): boolean {
    return mimeType.startsWith('image/');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        res.status(405).json({ message: "Method not allowed" });
        return;
    }

    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    if (!apiKey) {
        res.status(500).json({ message: "Missing API key" });
        return;
    }

    try {
        // --- START: File Upload Handling (remains the same) ---
        const form = formidable({});
        
        const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) reject(err);
                resolve([fields, files]);
            });
        });
        
        const message = (fields.message?.[0] as string | undefined);
        const uploadedFile = files.file?.[0]; // Key: 'file'
        
        if (!message && !uploadedFile) {
            res.status(400).json({ message: "Message or file required" });
            return;
        }
        // --- END: File Upload Handling ---


        // --- START: Multimodal Content Building (NEW LOGIC) ---
        const chatMessages: ChatMessage[] = [{ role: "user", content: [] }];

        // 1. Add text content (user's input message)
        if (message) {
            chatMessages[0].content.push({ type: "text", text: message });
        }
        
        // 2. Process uploaded file content
        if (uploadedFile) {
            if (!uploadedFile.mimetype || !uploadedFile.filepath) {
                res.status(400).json({ message: "Invalid file data" });
                return;
            }

            const mimeType = uploadedFile.mimetype;
            
            if (isImageMimeType(mimeType)) {
                // If it's an image, convert to Base64 Data URL (Vision API requirement)
                const base64Image = fileToBase64(uploadedFile.filepath, mimeType);

                chatMessages[0].content.push({
                    type: "image_url",
                    image_url: {
                        url: base64Image,
                    },
                });
                
            } else {
                // If it's a PDF, code, or plain text file, read the content as text
                try {
                    const fileContent = fileToText(uploadedFile.filepath);
                    
                    // Prepend the file content to the user's message as another text block
                    // This allows the model to see the file content and the user's query.
                    chatMessages[0].content.push({
                        type: "text",
                        // Format the file content clearly so the model knows what it is
                        text: `\n--- START OF FILE: ${uploadedFile.originalFilename} (${mimeType}) ---\n${fileContent}\n--- END OF FILE ---`,
                    });
                } catch (readError) {
                    console.error("Error reading non-image file:", readError);
                    res.status(500).json({ message: "Could not read uploaded file content." });
                    return;
                }
            }
            
            // Clean up the temporary file immediately
            fs.unlinkSync(uploadedFile.filepath);
        }
        // --- END: Multimodal Content Building ---
        
        const response = await fetch(
            "https://vision-demo-shopline.openai.azure.com/openai/deployments/gpt-4.1-vishon-demo-shopline/chat/completions?api-version=2025-01-01-preview",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "api-key": apiKey
                },
                body: JSON.stringify({
                    messages: chatMessages, // ⬅️ Sending the multimodal array
                    // Optional: You might want to add max_tokens or temperature here
                })
            }
        );

        const data: { choices?: { message: { content: string } }[] } = await response.json();

        // Handle API errors
        if (!response.ok) {
            // Check for potential API rate limits or other detailed errors
            const errorData = data as { error?: { message: string } };
            console.error("Azure OpenAI API Error:", errorData);
            res.status(response.status).json({ message: errorData.error?.message || "Error calling Azure OpenAI API" });
            return;
        }

        const reply = data?.choices?.[0]?.message?.content || "No response";

        res.status(200).json({ reply });
    } catch (error) {
        console.error("General Request Error:", error);
        res.status(500).json({ message: "Error processing request or calling Azure OpenAI API" });
    }
}