import { handleStudyPlan } from "../_shared/geminiService.js";

export default async function handler(req, res) {
  try {
    res.setHeader("Content-Type", "application/json");
    if (req.method !== "POST") {
      return res.status(405).json({ success: false, error: "Method not allowed. Use POST." });
    }
    return await handleStudyPlan(req, res);
  } catch (fatalError) {
    console.error("Gemini planner API failure:", fatalError?.message || "Unhandled runtime error");
    if (!res.headersSent) {
      res.setHeader("Content-Type", "application/json");
      return res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }
}
