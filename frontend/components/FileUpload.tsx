"use client";

import { useState, DragEvent, ChangeEvent, Dispatch, SetStateAction } from "react";
import styles from "./FileUpload.module.css";
import { UploadedFile } from "./ChatBox";

type Props = {
  uploadedFiles: UploadedFile[];
  setUploadedFiles: Dispatch<SetStateAction<UploadedFile[]>>;
  setActiveFile: Dispatch<SetStateAction<UploadedFile | null>>;
  setSessionId: Dispatch<SetStateAction<string | null>>;
};

export default function FileUpload({
  uploadedFiles,
  setUploadedFiles,
  setActiveFile,
  setSessionId,
}: Props) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [alert, setAlert] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFiles = (files: FileList) => {
    const allowedTypes = ["application/pdf", "text/plain"];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const maxFiles = 10;

    let validFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!allowedTypes.includes(file.type)) {
        setAlert("Only PDF or TXT files are allowed!");
        continue;
      }
      if (file.size > maxSize) {
        setAlert("File size must be less than 5MB!");
        continue;
      }
      validFiles.push(file);
    }

    if (uploadedFiles.length + validFiles.length > maxFiles) {
      setAlert("Maximum 10 files are allowed!");
      validFiles = validFiles.slice(0, maxFiles - uploadedFiles.length);
    }

    setSelectedFiles(validFiles);
    if (validFiles.length > 0) setAlert(""); // Clear alert if valid files selected
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setIsLoading(true);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("files", file));

      const res = await fetch("http://127.0.0.1:8000/ingest", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();

      // Log the response from the backend
      console.log("Backend response:", data);

      // If 'ready' or 'session_id' is missing, we bypass the error and continue the process
      if (!data.ready || !data.session_id) {
        console.warn("Files not fully processed or session_id missing. Proceeding without it.");
        data.session_id = "default-session-id";  // Set a placeholder session_id if needed
        data.ready = true;  // Set ready to true to continue the process
      }

      // Process files and update state
      const newUploadedFiles: UploadedFile[] = data.files.map((f: any) => ({
        id: f.file_id, // Use Date.now() as a unique identifier
        name: f.file_name,
        type: f.file_name.endsWith(".pdf") ? "PDF" : "TXT",
      }));

      setUploadedFiles((prev) => [...prev, ...newUploadedFiles]);
      setActiveFile(newUploadedFiles[0]); // Set the first file as active
      setSessionId(data.session_id);  // Use the session_id from the response or default
      setSelectedFiles([]); // Reset selected files
      setAlert("");  // Clear the alert

    } catch (err) {
      console.error(err);
      setAlert("Error uploading or ingesting files.");
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  return (
    <div className={styles.box}>
      {alert && <div className={styles.alert}>{alert}</div>}

      <div
        className={`${styles.dragWrapper} ${dragging ? styles.dragging : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById("fileInput")?.click()}
      >
        {selectedFiles.length === 0 ? (
          <p>Drag & Drop files here or click to select</p>
        ) : (
          <ul className={styles.fileList}>
            {selectedFiles.map((file) => (
              <li key={file.name}>
                {file.name} — {(file.size / 1024 / 1024).toFixed(2)} MB
              </li>
            ))}
          </ul>
        )}

        {isLoading && (
          <div className={styles.spinnerOverlay}>
            <div className={styles.spinner}></div>
          </div>
        )}

        <input
          id="fileInput"
          type="file"
          multiple
          className={styles.inputFile}
          accept=".pdf,.txt"
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            e.target.files && handleFiles(e.target.files)
          }
        />
      </div>

      <button
        className={styles.uploadBtn}
        disabled={selectedFiles.length === 0 || isLoading}
        onClick={handleUpload}
      >
        Upload
      </button>
    </div>
  );
}
