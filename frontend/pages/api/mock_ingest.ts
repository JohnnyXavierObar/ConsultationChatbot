// pages/api/ingest.ts
import type { NextApiRequest, NextApiResponse } from "next";

type IngestResponse = {
  success: boolean;
  message: string;
  fileId?: string; // you can use this to track file status
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<IngestResponse>
) {
  if (req.method === "POST") {
    const { fileName, fileSize } = req.body;

    // Basic validation
    if (!fileName || !fileSize) {
      return res.status(400).json({ success: false, message: "No file info provided" });
    }

    if (!/\.(pdf|txt)$/i.test(fileName)) {
      return res.status(400).json({ success: false, message: "Only PDF/TXT allowed" });
    }

    if (fileSize > 5 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: "File exceeds 5MB" });
    }

    // Simulate file processing
    const fileId = Date.now().toString(); // simple unique id
    console.log(`Processing file: ${fileName}, id: ${fileId}`);

    // Normally, you would save the file or push to a queue here

    res.status(200).json({ success: true, message: "File ingested", fileId });
  } else {
    res.status(405).json({ success: false, message: "Method Not Allowed" });
  }
}
