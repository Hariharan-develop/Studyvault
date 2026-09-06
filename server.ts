import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import {
  handleHealth,
  handleProcessMaterial,
  handleChat,
  handleNotes,
  handleQuiz,
  handleQuizFeedback,
  handleStudyPlan,
  handleReflection
} from "./api/_shared/geminiService.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Body parsers
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Register shared API endpoints (reused across Express / Cloud Run and Vercel)
app.get("/api/health", handleHealth);
app.post("/api/materials/process", handleProcessMaterial);
app.post("/api/gemini/chat", handleChat);
app.post("/api/gemini/notes", handleNotes);
app.post("/api/gemini/quiz", handleQuiz);
app.post("/api/gemini/quiz-feedback", handleQuizFeedback);
app.post("/api/gemini/study-plan", handleStudyPlan);
app.post("/api/gemini/planner", handleStudyPlan);
app.post("/api/gemini/reflection", handleReflection);

// Vite middleware / Static asset serving (Cloud Run & Local Dev)
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`StudyVault AI server running on port ${PORT}`);
  });
}

startServer();

export default app;
