"use client";

import { useState } from "react";
import styles from "./ChatBox.module.css"; // Correct path for the CSS module

export type UploadedFile = {
  id: number;
  name: string;
  type: string;
};

type Props = {
  activeFile: UploadedFile;
  sessionId: string | null;
  uploadedFiles: UploadedFile[];
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
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [messageId, setMessageId] = useState(0); // Counter for message IDs

  const handleSend = async () => {
    if (!newMessage.trim() || !sessionId) return;

    const userText = newMessage;
    setNewMessage("");

    // Add user message to state
    setMessages((prev) => [
      ...prev,
      { id: messageId, sender: "user", text: userText },
    ]);
    setMessageId((prevId) => prevId + 1); // Increment messageId to ensure unique keys

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

      console.log(data)

      // Add bot message to state
      setMessages((prev) => [
        ...prev,
        { id: messageId + 1, sender: "bot", text: data.response },
      ]);
      setMessageId((prevId) => prevId + 1); // Increment again for bot response
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: messageId + 2,
          sender: "bot",
          text: "Error contacting server",
        },
      ]);
      setMessageId((prevId) => prevId + 1); // Increment for error message
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h2>Consultation Chat</h2>
      </header>

      {/* Body */}
      <div className={styles.body}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <h4>Files</h4>
          <ul>
            {uploadedFiles.map((file) => (
              <li
                key={file.id} // Use unique `file.id` for list keys
                className={`${file.id === activeFile.id ? styles.active : ""} ${styles.fileItem}`}
              >
                <div className={styles.fileIcon}>
                  {/* Example: Show different icons based on file type */}
                  {file.type === "pdf" ? "📄" : "📁"}
                </div>
                {file.name}
              </li>
            ))}
          </ul>
        </aside>

        {/* Main Content */}
        <main className={styles.main}>
          <div className={styles.messages}>
            {messages.map((msg) => (
              <div
                key={msg.id} // Ensure unique `key` for each message
                className={`${styles.message} ${msg.sender === "user" ? styles.userMsg : styles.botMsg}`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          {/* Input Box (Fixed at the bottom) */}
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
