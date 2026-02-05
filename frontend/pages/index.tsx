"use client";

import { useState } from "react";
import FileUpload from "../components/FileUpload";
import ChatBox from "../components/ChatBox";

export type UploadedFile = {
  id: number;
  name: string;
  type: string;
};

export default function Home() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [activeFile, setActiveFile] = useState<UploadedFile | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#f3f4f6",
        flexDirection: "column",
      }}
    >
      {!activeFile ? (
        <FileUpload
          uploadedFiles={uploadedFiles}
          setUploadedFiles={setUploadedFiles}
          setActiveFile={setActiveFile}
          setSessionId={setSessionId}
        />
      ) : (
        <ChatBox
          activeFile={activeFile}
          sessionId={sessionId}
          uploadedFiles={uploadedFiles}
        />
      )}
    </div>
  );
}
