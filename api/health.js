import { handleHealth } from "./_shared/geminiService.js";

export default async function handler(req, res) {
  try {
    res.setHeader("Content-Type", "application/json");
    return await handleHealth(req, res);
  } catch (fatalError) {
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
