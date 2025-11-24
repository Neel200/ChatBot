// utils/chatUtils.ts
export const cleanMarkdown = (text: string) => {
  // Removes lines that contain only optional whitespace and 'n' or 'N'
  return text.replace(/^\s*[nN]\s*$/gm, "");
};

export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}