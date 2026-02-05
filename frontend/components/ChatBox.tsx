"use client";

import { useState } from "react";
import styles from "./ChatBox.module.css";

export type UploadedFile = {
  id: number;
  name: string;
  type: string;
};

export type Reference = {
  content: string;
  file_id: number;
  page_number: number;
  file_name: string;
};

type Props = {
  activeFile: UploadedFile;
  sessionId: string | null;
  uploadedFiles: UploadedFile[];
  references: Reference[]; // Add references as a prop
};

type Message = {
  id: number;
  sender: "user" | "bot";
  text: string;
};

export default function ChatBox({
  activeFile,
  sessionId,
  uploadedFiles,
  references: initialReferences, // rename for clarity
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [messageId, setMessageId] = useState(0);
  const [references, setReferences] = useState<Reference[]>(initialReferences); // local state

  const handleSend = async () => {
    if (!newMessage.trim() || !sessionId) return;

    const userText = newMessage;
    setNewMessage("");

    // Add user message
    setMessages((prev) => [
      ...prev,
      { id: messageId, sender: "user", text: userText },
    ]);
    setMessageId((prevId) => prevId + 1);

    // Add temporary loading message for AI
    const loadingId = messageId + 1;
    setMessages((prev) => [
      ...prev,
      { id: loadingId, sender: "bot", text: "Loading..." },
    ]);

    try {
      const res = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: userText,
          session_id: sessionId,
          file_ids: uploadedFiles.map((f) => f.id),
        }),
      });

      const data = await res.json();

      // Replace loading message with actual AI response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingId ? { ...msg, text: data.ai_response } : msg
        )
      );
      setMessageId((prevId) => prevId + 1);

      // Update references dynamically if AI returned new ones
      if (data.references && Array.isArray(data.references)) {
        setReferences((prev) => [
        ...prev,
        ...data.references.filter(
            (r: any) => !prev.some((p) => p.file_id === r.file_id && p.page_number === r.page_number)
        ),
        ]);
      }
    } catch {
      // Replace loading with error message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingId ? { ...msg, text: "Error contacting server" } : msg
        )
      );
      setMessageId((prevId) => prevId + 1);
    }
  };



  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2>Consultation Chat</h2>
      </header>

      <div className={styles.body}>
        {/* Sidebar: Files + References */}
        <aside className={styles.sidebar}>
            <h4>Files</h4>
            <ul>
            {uploadedFiles.map((file) => (
                <li
                key={file.id}
                className={`${file.id === activeFile.id ? styles.active : ""} ${styles.fileItem}`}
                >
                <div className={styles.fileIcon}>
                    {file.type === "pdf" ? "📄" : "📁"}
                </div>
                {file.name}
                </li>
            ))}
            </ul>

            <h4>References</h4>
            <ul>
            {references.map((ref, idx) => (
                <li key={idx} className={styles.referenceItem}>
                <strong>{ref.file_name}</strong> - Page {ref.page_number}
                <p className={styles.referenceContent}>
                    {ref.content.length > 100
                    ? ref.content.slice(0, 100) + "…"
                    : ref.content}
                </p>
                </li>
            ))}
            </ul>
        </aside>

        {/* Main chat */}
        <main className={styles.main}>
            <div className={styles.messages}>
            {messages.map((msg) => (
                <div
                key={msg.id}
                className={`${styles.message} ${
                    msg.sender === "user" ? styles.userMsg : styles.botMsg
                }`}
                >
                {msg.text}
                </div>
            ))}
            </div>

            <div className={styles.inputBox}>
            <input
                value={newMessage}
                placeholder="Type your message…"
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button onClick={handleSend} disabled={!newMessage.trim()}>
                Send
            </button>
            </div>
        </main>
        </div>

    </div>
  );
}
