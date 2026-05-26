export type Role = "user" | "bot";

export interface FileData {
  name: string;
  url?: string;
  mimeType: string;
}

export interface Message {
  _id?: string;
  role: Role;
  text: string;
  file?: FileData;
}

export interface ApiResponse {
  reply?: string;
  conversationId?: string;
  messages?: Message[];
}

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageUrlContent = {
  type: "image_url";
  image_url: {
    url: string;
  };
};

export type MessageContent = TextContent | ImageUrlContent;

export type OpenAIRole = "user" | "assistant" | "system";

export interface ChatMessage {
  role: OpenAIRole;
  content: MessageContent[];
}


export interface OpenAIChatCompletionRequest {
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
}

export interface OpenAIChatMessageResponse {
  role: string;
  content: string;
}

export interface OpenAIChoice {
  index: number;
  message: OpenAIChatMessageResponse;
  finish_reason: string | null;
}

export interface OpenAIChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAIChoice[];
}

export type FileContentPart = TextContent | ImageUrlContent;

export interface JwtPayload {
  userId: string;
  iat: number;
  exp: number;
}
