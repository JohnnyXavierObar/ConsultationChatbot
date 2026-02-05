// pages/api/status.ts
import type { NextApiRequest, NextApiResponse } from "next";

type StatusResponse = {
  status: "processing" | "done";
  message: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<StatusResponse>
) {
  if (req.method === "GET") {
    const { fileId } = req.query;

    if (!fileId || typeof fileId !== "string") {
      return res.status(400).json({ status: "processing", message: "No fileId provided" });
    }

    // Here we simulate file processing
    // For demo, files with even timestamp are "done", odd are "processing"
    const done = parseInt(fileId) % 2 === 0;

    res.status(200).json({
      status: done ? "done" : "processing",
      message: done ? "File ready" : "Still processing",
    });
  } else {
    res.status(405).json({ status: "processing", message: "Method Not Allowed" });
  }
}
