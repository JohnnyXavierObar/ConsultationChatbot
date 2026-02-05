// pages/api/mock_chat.ts
import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData = {
  message: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method === "POST") {
    const { prompt } = req.body;
    // Mock response logic
    res.status(200).json({ message: `You said: ${prompt}` });
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
