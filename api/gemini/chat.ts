import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleChat } from "../_shared/geminiService";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    res.setHeader("Content-Type", "application/json");
    if (req.method !== "POST") {
      return res.status(405).json({ success: false, error: "Method not allowed. Use POST." });
    }
    return await handleChat(req, res);
  } catch (fatalError: any) {
    console.error("Gemini chat API failure:", fatalError?.message || "Unhandled runtime error");
    if (!res.headersSent) {
      res.setHeader("Content-Type", "application/json");
      return res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }
}
