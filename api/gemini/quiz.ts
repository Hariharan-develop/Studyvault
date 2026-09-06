import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleQuiz } from "../_shared/geminiService";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    res.setHeader("Content-Type", "application/json");
    if (req.method !== "POST") {
      return res.status(405).json({ success: false, error: "Method not allowed. Use POST." });
    }
    return await handleQuiz(req, res);
  } catch (fatalError: any) {
    console.error("Gemini quiz API failure:", fatalError?.message || "Unhandled runtime error");
    if (!res.headersSent) {
      res.setHeader("Content-Type", "application/json");
      return res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }
}
