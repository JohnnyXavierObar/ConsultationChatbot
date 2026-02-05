import "./globals.css";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function RootLayout({ children }: Props) {
  return (
    <html lang="en">
      <body style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        {/* Header */}
        <header
          style={{
            height: "60px",
            backgroundColor: "#1d4ed8",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
            fontSize: "1.25rem",
            fontWeight: 600,
          }}
        >
          Consultation Chatbot
        </header>

        {/* Main body */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {children}
        </div>

        {/* Footer */}
        <footer
          style={{
            height: "40px",
            backgroundColor: "#e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.9rem",
            color: "#333",
          }}
        >
          &copy; 2026 Your Company
        </footer>
      </body>
    </html>
  );
}
