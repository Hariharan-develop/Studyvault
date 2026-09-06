import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleHealth } from "./_shared/geminiService";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    res.setHeader("Content-Type", "application/json");
    return await handleHealth(req, res);
  } catch (fatalError: any) {
    console.error("Health API failure:", fatalError?.message || "Unhandled error");
    if (!res.headersSent) {
      res.setHeader("Content-Type", "application/json");
      return res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }
}
