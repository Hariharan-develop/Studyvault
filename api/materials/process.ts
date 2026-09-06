import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleProcessMaterial } from "../_shared/geminiService";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Content-Type", "application/json");
    res.status(405).json({ success: false, error: "Method not allowed. Use POST." });
    return;
  }
  return handleProcessMaterial(req, res);
}
