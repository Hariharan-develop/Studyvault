import { GoogleGenAI } from "@google/genai";
import { requireAuth } from "./auth.js";

// Model Fallback Ladder strictly adhering to Production Directives
export const MODEL_FALLBACK_LADDER = [
  "gemini-3.6-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.7-flash",
  "gemini-2.5-flash",
  "gemini-3.8-flash"
];

// Helper to safely check GEMINI_API_KEY without throwing uncaught exceptions
export function checkGeminiApiKey(res) {
  if (!process.env.GEMINI_API_KEY) {
    res.setHeader?.("Content-Type", "application/json");
    res.status(500).json({
      success: false,
      error: "Gemini API key is not configured"
    });
    return false;
  }
  return true;
}

// Lazy-initialized GoogleGenAI Client
let genAIClient = null;
export function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is not configured");
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "studyvault-ai-build"
        }
      }
    });
  }
  return genAIClient;
}

// Resilient fallback executor with automated Error Recovery Matrix
export async function generateContentWithFallback(requestParams) {
  const ai = getGenAI();
  let lastError = null;

  for (let i = 0; i < MODEL_FALLBACK_LADDER.length; i++) {
    const model = MODEL_FALLBACK_LADDER[i];
    try {
      const response = await ai.models.generateContent({
        ...requestParams,
        model
      });
      return { response, modelUsed: model };
    } catch (err) {
      lastError = err;
      const statusCode = err?.status || err?.statusCode || 500;
      if (statusCode === 400 && !err?.message?.includes("not supported")) {
        throw err;
      }
    }
  }

  throw lastError || new Error("All models in the fallback ladder failed to generate content.");
}

// Robust JSON extraction and parsing utility that strips markdown backticks
export function cleanAndParseJson(rawText, fallback) {
  if (!rawText || typeof rawText !== "string") return fallback;
  let clean = rawText.trim();

  if (clean.startsWith("```")) {
    clean = clean.replace(/^```(?:json)?\s*/i, "");
    clean = clean.replace(/\s*```$/, "");
    clean = clean.trim();
  }

  try {
    return JSON.parse(clean);
  } catch (err) {
    const startObj = clean.indexOf("{");
    const endObj = clean.lastIndexOf("}");
    if (startObj !== -1 && endObj > startObj) {
      try {
        const objStr = clean.slice(startObj, endObj + 1);
        return JSON.parse(objStr);
      } catch {}
    }

    const startArr = clean.indexOf("[");
    const endArr = clean.lastIndexOf("]");
    if (startArr !== -1 && endArr > startArr) {
      try {
        const arrStr = clean.slice(startArr, endArr + 1);
        return JSON.parse(arrStr);
      } catch {}
    }

    return fallback;
  }
}

// Safely normalize and parse request body in Vercel / Express
export function parseRequestBody(req) {
  if (!req) return {};
  let body = req.body;
  if (!body) return {};

  if (Buffer.isBuffer(body)) {
    try {
      body = JSON.parse(body.toString("utf-8"));
    } catch {
      return {};
    }
  } else if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return {};
    }
  }

  return (typeof body === "object" && body !== null ? body : {});
}

// Chunk scoring utility for retrieval
export function scoreChunkRelevance(queryStr, content, heading = "") {
  if (!queryStr.trim() || !content.trim()) return 0;
  const stopWords = new Set([
    "the", "is", "at", "which", "on", "a", "an", "and", "or", "to", "in", "for", "of",
    "what", "how", "why", "explain", "describe", "with", "this", "that", "these", "those", "from"
  ]);
  const tokens = queryStr
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !stopWords.has(t));

  if (tokens.length === 0) return 0.5;

  const lowerContent = content.toLowerCase();
  const lowerHeading = heading.toLowerCase();

  let score = 0;
  for (const token of tokens) {
    if (lowerHeading.includes(token)) {
      score += 4;
    }
    const regex = new RegExp(`\\b${token}\\b`, "g");
    const matches = lowerContent.match(regex);
    if (matches) {
      score += Math.min(matches.length, 5);
    }
  }

  return score;
}

// Local chunking generator
export function createLocalChunks(text, materialId, materialName, subject, materialType) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const chunks = [];

  let currentChunkText = "";
  let currentHeading = materialName;
  let chunkIdx = 0;
  let estimatedPage = 1;
  let charCounter = 0;

  for (const para of paragraphs) {
    if (para.startsWith("#") || (para.length < 80 && !para.endsWith(".") && para === para.toUpperCase())) {
      currentHeading = para.replace(/^#+\s*/, "").slice(0, 80);
    }

    if ((currentChunkText + "\n\n" + para).length > 850 && currentChunkText.length > 200) {
      charCounter += currentChunkText.length;
      estimatedPage = Math.floor(charCounter / 1800) + 1;
      chunks.push({
        id: `chunk_${materialId}_${chunkIdx}`,
        materialId,
        materialName,
        subject,
        type: materialType,
        pageNumber: estimatedPage,
        heading: currentHeading,
        chunkIndex: chunkIdx,
        content: currentChunkText.trim(),
      });
      chunkIdx++;
      currentChunkText = para;
    } else {
      currentChunkText = currentChunkText ? `${currentChunkText}\n\n${para}` : para;
    }
  }

  if (currentChunkText.trim()) {
    charCounter += currentChunkText.length;
    estimatedPage = Math.floor(charCounter / 1800) + 1;
    chunks.push({
      id: `chunk_${materialId}_${chunkIdx}`,
      materialId,
      materialName,
      subject,
      type: materialType,
      pageNumber: estimatedPage,
      heading: currentHeading,
      chunkIndex: chunkIdx,
      content: currentChunkText.trim(),
    });
  }

  return chunks;
}

// -----------------------------------------------------------------------------
// Route Handlers
// -----------------------------------------------------------------------------

// 1. Health Check
export async function handleHealth(_req, res) {
  res.setHeader?.("Content-Type", "application/json");
  return res.status(200).json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString()
  });
}

// 2. Study Material Processing & Multimodal Extraction
export async function handleProcessMaterial(req, res) {
  res.setHeader?.("Content-Type", "application/json");
  if (!checkGeminiApiKey(res)) return;
  const authUser = await requireAuth(req, res);
  if (!authUser) return;

  try {
    const body = parseRequestBody(req);
    const {
      materialId = `mat_${Date.now()}`,
      fileName = "document",
      fileType = "txt",
      subject = "General",
      materialType = "Class Notes",
      base64Content = "",
      textContent = ""
    } = body;

    let extractedText = "";
    let summary = "";
    let chunks = [];

    const isImageOrPdf =
      ["pdf", "png", "jpg", "jpeg", "webp"].includes(String(fileType).toLowerCase()) ||
      String(base64Content).startsWith("data:image/") ||
      String(base64Content).startsWith("data:application/pdf");

    if (isImageOrPdf && base64Content) {
      try {
        const cleanBase64 = String(base64Content).replace(/^data:.*?;base64,/, "").trim();
        let mimeType = "application/pdf";
        if (fileType.toLowerCase().includes("png")) mimeType = "image/png";
        else if (fileType.toLowerCase().includes("jpg") || fileType.toLowerCase().includes("jpeg")) mimeType = "image/jpeg";
        else if (fileType.toLowerCase().includes("webp")) mimeType = "image/webp";

        const systemInstruction = `You are a high-fidelity academic document and handwritten lecture notes extraction OCR system.
Extract all legible study content from this document (including handwritten notes, printed text, mathematical formulas, and text descriptions of diagrams).
Structure your response strictly as valid JSON matching this schema:
{
  "summary": "2-3 sentence overview of this material",
  "extractedText": "Full reconstructed text with proper headings and formulas in LaTeX",
  "chunks": [
    {
      "pageNumber": 1,
      "heading": "Section Heading or Topic",
      "content": "Specific detailed paragraph or concept text (300-800 characters)"
    }
  ]
}`;

        const { response } = await generateContentWithFallback({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Please analyze and extract complete study content from this uploaded ${materialType}: "${fileName}" in subject "${subject}". Convert mathematical equations to clean Markdown/KaTeX formulas.`
                },
                {
                  inlineData: {
                    mimeType,
                    data: cleanBase64
                  }
                }
              ]
            }
          ],
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            temperature: 0.2
          }
        });

        const rawText = response.text || "";
        const parsed = cleanAndParseJson(rawText, {});
        extractedText = parsed.extractedText || "";
        summary = parsed.summary || "";
        if (!extractedText && rawText) {
          extractedText = rawText.replace(/```(?:json)?/gi, "").trim();
        }
        if (Array.isArray(parsed.chunks) && parsed.chunks.length > 0) {
          chunks = parsed.chunks.map((c, idx) => ({
            id: `chunk_${materialId}_${idx}`,
            materialId,
            materialName: fileName,
            subject,
            type: materialType,
            pageNumber: Number(c.pageNumber) || 1,
            heading: String(c.heading || fileName).slice(0, 80),
            chunkIndex: idx,
            content: String(c.content || "").trim(),
          }));
        }
      } catch (geminiErr) {
        if (textContent) {
          extractedText = textContent;
        } else if (base64Content) {
          try {
            const cleanBase64 = String(base64Content).replace(/^data:.*?;base64,/, "").trim();
            extractedText = Buffer.from(cleanBase64, "base64").toString("utf-8");
          } catch {}
        }
      }
    } else {
      if (textContent) {
        extractedText = textContent;
      } else if (base64Content) {
        try {
          const cleanBase64 = String(base64Content).replace(/^data:.*?;base64,/, "").trim();
          extractedText = Buffer.from(cleanBase64, "base64").toString("utf-8");
        } catch {
          extractedText = "";
        }
      }
    }

    if ((!chunks || chunks.length === 0) && extractedText) {
      chunks = createLocalChunks(extractedText, materialId, fileName, subject, materialType);
      summary = extractedText.slice(0, 200).replace(/\s+/g, " ") + "...";
    }

    if (!extractedText.trim() && chunks.length === 0) {
      extractedText = `Study material for ${subject}: ${fileName} (${materialType}). Ready for smart note synthesis and study companion Q&A.`;
      chunks = createLocalChunks(extractedText, materialId, fileName, subject, materialType);
      summary = `Processed study material: ${fileName} in ${subject}.`;
    }

    return res.status(200).json({
      success: true,
      processingStatus: "ready",
      extractedText,
      summary,
      chunkCount: chunks.length,
      chunks
    });
  } catch (error) {
    console.error("Gemini chat API failure:", error?.message || "Document processing error");
    return res.status(500).json({
      success: false,
      processingStatus: "failed",
      error: "An unexpected error occurred during document processing."
    });
  }
}

// 3. Multi-turn AI Study Chat
export async function handleChat(req, res) {
  res.setHeader?.("Content-Type", "application/json");
  if (!checkGeminiApiKey(res)) return;
  const authUser = await requireAuth(req, res);
  if (!authUser) return;

  try {
    const body = parseRequestBody(req);
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const subject = typeof body.subject === "string" ? body.subject.slice(0, 100) : "General Study";
    const sourceMode = ["materials_only", "materials_plus_gemini", "gemini_only"].includes(body.sourceMode)
      ? body.sourceMode
      : "gemini_only";
    const studyInstructions = typeof body.studyInstructions === "string" ? body.studyInstructions.trim().slice(0, 2000) : "";
    const answerFormat = ["text", "handwritten", "both"].includes(body.answerFormat) ? body.answerFormat : "text";
    const selectedMaterials = Array.isArray(body.selectedMaterials) ? body.selectedMaterials : [];

    if (messages.length === 0) {
      return res.status(400).json({ success: false, error: "At least one message is required." });
    }

    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    const queryPrompt = String(lastUserMsg?.text || "");

    let retrievedContext = "";
    const referencedSources = [];

    if (sourceMode !== "gemini_only" && selectedMaterials.length > 0) {
      const allChunks = [];
      let syllabusText = "";

      for (const mat of selectedMaterials) {
        if (mat.type === "Syllabus" && mat.extractedText) {
          syllabusText += `\n[Official Syllabus Outline: ${mat.name}]\n${mat.extractedText.slice(0, 3000)}\n`;
        }
        if (Array.isArray(mat.chunks) && mat.chunks.length > 0) {
          allChunks.push(...mat.chunks);
        } else if (mat.extractedText) {
          allChunks.push({
            id: `chunk_${mat.id}_0`,
            materialId: mat.id,
            materialName: mat.name,
            subject: mat.subject || subject,
            type: mat.type || "Notes",
            pageNumber: 1,
            heading: mat.name,
            chunkIndex: 0,
            content: mat.extractedText.slice(0, 2000),
          });
        }
      }

      const scoredChunks = allChunks.map((chunk) => ({
        ...chunk,
        score: scoreChunkRelevance(queryPrompt, chunk.content, chunk.heading),
      }));

      scoredChunks.sort((a, b) => b.score - a.score);
      const topChunks = scoredChunks.slice(0, 5);

      if (topChunks.length > 0) {
        retrievedContext = "=== RETRIEVED STUDENT STUDY MATERIALS (HIGH RELEVANCE) ===\n";
        for (const c of topChunks) {
          retrievedContext += `\n[Source: ${c.materialName} (Page ${c.pageNumber || 1}, Section: "${c.heading}")]\n${c.content}\n`;
          if (!referencedSources.some((s) => s.materialId === c.materialId && s.pageNumber === c.pageNumber)) {
            referencedSources.push({
              materialId: c.materialId,
              materialName: c.materialName,
              pageNumber: c.pageNumber || 1,
              section: c.heading,
              excerpt: c.content.slice(0, 160) + "...",
            });
          }
        }
      }

      if (syllabusText) {
        retrievedContext += `\n=== SYLLABUS REFERENCE ===\n${syllabusText}`;
      }
    }

    if (sourceMode === "materials_only" && referencedSources.length === 0 && selectedMaterials.length > 0) {
      const fallbackReply = `I am operating in **Strict Materials Only** mode, but couldn't find matching concepts in your checked study materials for "${queryPrompt.slice(0, 80)}". Please switch to **Selected + Gemini** or upload relevant lecture notes.`;
      return res.status(200).json({
        success: true,
        reply: fallbackReply,
        response: fallbackReply,
        referencedSources: [],
        modelUsed: "local-grounding-guard",
        sourceMode,
        answerFormat
      });
    }

    let groundingConstraint = "";
    if (sourceMode === "materials_only") {
      groundingConstraint = `\nSTRICT GROUNDING DIRECTIVE: You MUST ONLY answer based on the provided RETRIEVED STUDENT STUDY MATERIALS below. If the information cannot be found or deduced with certainty from these materials, honestly state: "This concept is not covered in your selected study materials." DO NOT speculate or bring external facts.`;
    } else if (sourceMode === "materials_plus_gemini") {
      groundingConstraint = `\nHYBRID GROUNDING DIRECTIVE: Prioritize the provided RETRIEVED STUDENT STUDY MATERIALS as the authoritative base for definitions, syllabus terms, and course notation. Seamlessly complement with broader academic knowledge to clarify, explain deeply, and provide intuitive analogies.`;
    } else {
      groundingConstraint = `\nGENERAL ACADEMIC MODE: Answer with comprehensive, high-clarity academic depth, structured derivations, and clear intuition.`;
    }

    let formatGuideline = "";
    if (answerFormat === "handwritten" || answerFormat === "both") {
      formatGuideline = `\nHANDWRITTEN NOTEBOOK RENDERING SPECIFICATION:
Present your explanation formatted like clean handwritten student lecture notes:
- Use concise bulleted headings and indented sub-bullets
- Place key formulas on their own centered lines surrounded by $$ ... $$
- Use bold highlighting for critical exam keywords
- Add small illustrative ASCII/Unicode diagrams, memory hooks, and boxed exam tips [EXAM TIP: ...]`;
    }

    let customInstructionsPrompt = "";
    if (studyInstructions) {
      customInstructionsPrompt = `\nSTUDENT'S CUSTOM STUDY PREFERENCES:\n${studyInstructions}\nStrictly adhere to these preferences.`;
    }

    const systemInstruction = `You are StudyVault AI, a world-class private academic tutor and study companion.
Subject Focus: ${subject}
Current Source Grounding Mode: ${sourceMode}
Requested Answer Style: ${answerFormat}

Primary Directives:
1. Explain with crystal clarity, progressive depth, and pedagogical empathy.
2. Structure answers with Markdown: # Title, ## Sub-sections, bold terms, and bullet points.
3. For math, physics, or engineering, ALWAYS render mathematical notation in LaTeX using $inline$ or $$display block$$.
4. Highlight real-world intuition before diving into formal mathematics.
5. Provide memory anchors, exam tips, and practical examples.
${groundingConstraint}
${customInstructionsPrompt}
${formatGuideline}`;

    const contents = messages.slice(-10).map((m, idx) => {
      let text = String(m.text || "");
      if (idx === messages.slice(-10).length - 1 && retrievedContext) {
        text = `${retrievedContext}\n\n---\nStudent Question: ${text}`;
      }
      return {
        role: m.role === "assistant" || m.role === "model" ? "model" : "user",
        parts: [{ text }]
      };
    });

    const { response, modelUsed } = await generateContentWithFallback({
      contents,
      config: {
        systemInstruction,
        temperature: sourceMode === "materials_only" ? 0.2 : 0.6,
      }
    });

    const reply = response.text || "I was unable to generate a response. Please try asking in a different way.";

    return res.status(200).json({
      success: true,
      reply,
      response: reply,
      referencedSources,
      modelUsed,
      sourceMode,
      answerFormat
    });
  } catch (error) {
    console.error("Gemini chat API failure:", error?.message || "Internal error");
    return res.status(500).json({
      success: false,
      error: "Unable to generate response"
    });
  }
}

// 4. Smart Notes Generator
export async function handleNotes(req, res) {
  res.setHeader?.("Content-Type", "application/json");
  if (!checkGeminiApiKey(res)) return;
  const authUser = await requireAuth(req, res);
  if (!authUser) return;

  try {
    const body = parseRequestBody(req);
    const subject = typeof body.subject === "string" ? body.subject.slice(0, 100) : "General";
    const topic = typeof body.topic === "string" ? body.topic.slice(0, 150) : "Overview";
    const content = typeof body.content === "string" ? body.content.slice(0, 15000) : "";

    if (!content.trim()) {
      return res.status(400).json({ success: false, error: "Study content or class notes cannot be empty." });
    }

    const systemInstruction = `You are an expert academic curriculum summarizer and cognitive learning specialist.
Transform the provided student notes into a structured, highly scannable, revision-ready study document.
Strictly return a valid JSON object matching this structure:
{
  "summary": "A concise 2-3 paragraph summary synthesizing the entire material",
  "simpleExplanation": "A plain English, intuitive explanation like explaining to a smart beginner",
  "keyConcepts": ["List of 4-8 core concepts with brief explanation"],
  "keyDefinitions": [
    { "term": "Term Name", "definition": "Precise academic definition" }
  ],
  "importantPoints": ["List of 4-8 critical takeaways and core formulas/mechanisms"],
  "revisionPoints": ["List of 5-8 quick-fire bullet points for pre-exam recall"]
}`;

    const prompt = `Subject: ${subject}\nTopic: ${topic}\n\nStudy Material:\n"""\n${content}\n"""`;

    const { response, modelUsed } = await generateContentWithFallback({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.3
      }
    });

    const rawText = response.text || "";
    let parsed = cleanAndParseJson(rawText, null);

    if (!parsed || typeof parsed !== "object" || !parsed.summary) {
      const cleanSummary = rawText.replace(/```[a-z]*\n?/gi, "").slice(0, 800).trim();
      parsed = {
        summary: cleanSummary || `Synthesized study overview of ${topic} for ${subject}. Covers primary principles, structural formulas, and exam key points.`,
        simpleExplanation: `Think of ${topic} as a foundational building block in ${subject} that organizes rules, data flow, and problem-solving mechanisms into clear sequential steps.`,
        keyConcepts: [
          `Core Principles of ${topic}`,
          `Operational Architecture and Mechanics`,
          `Practical Exam Applications and Problem-Solving`,
          `Systematic Analysis and Edge Conditions`
        ],
        keyDefinitions: [
          { term: topic, definition: `Primary concept and focal study topic within ${subject}.` }
        ],
        importantPoints: [
          `Master the fundamental theorems and core operational definitions.`,
          `Understand how ${topic} connects to the wider ${subject} syllabus.`,
          `Review sample numericals, diagrams, or architectural workflows.`
        ],
        revisionPoints: [
          `Rapid Recall: Key definition of ${topic}`,
          `Primary mechanism and sequential execution flow`,
          `Critical edge conditions and common exam pitfalls`
        ]
      };
    }

    return res.status(200).json({
      success: true,
      result: parsed,
      modelUsed
    });
  } catch (error) {
    console.error("Gemini chat API failure:", error?.message || "Notes generation error");
    return res.status(500).json({
      success: false,
      error: "Unable to generate notes"
    });
  }
}

// 5. AI Quiz Generator
export async function handleQuiz(req, res) {
  res.setHeader?.("Content-Type", "application/json");
  if (!checkGeminiApiKey(res)) return;
  const authUser = await requireAuth(req, res);
  if (!authUser) return;

  try {
    const body = parseRequestBody(req);
    const subject = typeof body.subject === "string" ? body.subject.slice(0, 100) : "General";
    const topic = typeof body.topic === "string" ? body.topic.slice(0, 150) : "General Knowledge";
    const content = typeof body.content === "string" ? body.content.slice(0, 12000) : "";
    const numQuestions = Math.min(Math.max(Number(body.numQuestions) || 5, 3), 15);
    const difficulty = ["easy", "medium", "hard"].includes(body.difficulty) ? body.difficulty : "medium";
    const questionType = ["mcq", "true_false", "short_answer"].includes(body.questionType) ? body.questionType : "mcq";

    const systemInstruction = `You are an expert pedagogical exam architect.
Create an active-recall quiz consisting of exactly ${numQuestions} questions based on the provided material.
Difficulty Level: ${difficulty}.
Question Type: ${questionType}.

Strict JSON output format:
{
  "questions": [
    {
      "question": "Clear question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Exact text matching one of the options (or model answer for short answer)",
      "explanation": "Clear pedagogical explanation of why this answer is correct and why other options are incorrect"
    }
  ]
}`;

    const prompt = `Subject: ${subject}\nTopic: ${topic}\nTarget Difficulty: ${difficulty}\nQuestion Format: ${questionType}\n\nSource Content (if provided):\n"""\n${content || `General knowledge about ${subject}: ${topic}`}\n"""`;

    const { response, modelUsed } = await generateContentWithFallback({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.4
      }
    });

    const parsed = cleanAndParseJson(response.text, { questions: [] });
    return res.status(200).json({
      success: true,
      questions: parsed.questions || [],
      modelUsed
    });
  } catch (error) {
    console.error("Gemini chat API failure:", error?.message || "Quiz generation error");
    return res.status(500).json({
      success: false,
      error: "Unable to generate quiz"
    });
  }
}

// 6. Quiz Feedback Evaluator
export async function handleQuizFeedback(req, res) {
  res.setHeader?.("Content-Type", "application/json");
  if (!checkGeminiApiKey(res)) return;
  const authUser = await requireAuth(req, res);
  if (!authUser) return;

  try {
    const body = parseRequestBody(req);
    const subject = typeof body.subject === "string" ? body.subject : "Subject";
    const topic = typeof body.topic === "string" ? body.topic : "Topic";
    const score = Number(body.score) || 0;
    const totalQuestions = Number(body.totalQuestions) || 1;
    const questions = Array.isArray(body.questions) ? body.questions : [];
    const answers = body.answers && typeof body.answers === "object" ? body.answers : {};

    const summaryReport = questions
      .map((q, i) => {
        const studentAns = answers[i] || "No answer";
        const isCorrect = String(studentAns).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
        return `Q${i + 1}: ${q.question}\nStudent Answer: ${studentAns}\nCorrect: ${q.correctAnswer}\nStatus: ${isCorrect ? "CORRECT" : "INCORRECT"}`;
      })
      .join("\n\n");

    const prompt = `A student just completed a quiz on ${subject} (${topic}).
Score: ${score} / ${totalQuestions} (${Math.round((score / totalQuestions) * 100)}%).
Here is the question-by-question breakdown:
${summaryReport}

Please provide:
1. Warm, encouraging feedback recognizing their effort.
2. Clear diagnosis of conceptual blind spots or misunderstandings from incorrect questions.
3. 2-3 specific, actionable recommendations for what to review next to achieve mastery.
Keep it constructive, inspiring, and concise (under 250 words).`;

    const { response, modelUsed } = await generateContentWithFallback({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.6
      }
    });

    return res.status(200).json({
      success: true,
      feedback: response.text || "Great effort completing the quiz! Keep reviewing your missed questions.",
      modelUsed
    });
  } catch (error) {
    console.error("Gemini chat API failure:", error?.message || "Quiz feedback error");
    return res.status(500).json({
      success: false,
      error: "Unable to evaluate quiz feedback"
    });
  }
}

// 7. AI Study Planner
export async function handleStudyPlan(req, res) {
  res.setHeader?.("Content-Type", "application/json");
  if (!checkGeminiApiKey(res)) return;
  const authUser = await requireAuth(req, res);
  if (!authUser) return;

  try {
    const body = parseRequestBody(req);
    const examName = typeof body.examName === "string" ? body.examName.slice(0, 100) : "Final Exam";
    const examDate = typeof body.examDate === "string" ? body.examDate : "";
    const subjects = Array.isArray(body.subjects) ? body.subjects.slice(0, 10) : [];
    const availableHoursPerDay = Math.min(Math.max(Number(body.availableHoursPerDay) || 3, 1), 16);
    const studyStartTime = typeof body.studyStartTime === "string" && body.studyStartTime.trim() ? body.studyStartTime.trim() : "09:00 AM";
    const studyEndTime = typeof body.studyEndTime === "string" && body.studyEndTime.trim() ? body.studyEndTime.trim() : "01:00 PM";
    const topicsToComplete = typeof body.topicsToComplete === "string" ? body.topicsToComplete.slice(0, 3000) : "";
    const difficulties = body.difficulties && typeof body.difficulties === "object" ? body.difficulties : {};
    const includedMaterials = Array.isArray(body.includedMaterials) ? body.includedMaterials.slice(0, 10) : [];

    const systemInstruction = `You are a high-performance academic strategist and spaced-repetition study planner.
Design a balanced, highly realistic day-by-day study schedule leading up to the student's exam.
CRITICAL TIME WINDOW REQUIREMENT:
The student has set their daily study schedule strictly FROM ${studyStartTime} TO ${studyEndTime}.
All daily study tasks for each day MUST start at or after ${studyStartTime} and conclude at or before ${studyEndTime}.
Incorporate:
- Progressive mastery from foundational to advanced topics
- Dedicated Spaced Revision Days (flagged with isRevision: true)
- Mock Test / Practice Days (flagged with isPractice: true)
- Realistic rest intervals (e.g. 10-15 mins between study sessions) within the ${studyStartTime} to ${studyEndTime} window
- When student study materials are provided, link appropriate tasks to them using materialName and materialId.
Strict JSON format:
{
  "planSummary": "Concise 2-3 sentence strategic rationale for the study plan layout",
  "totalStudyDays": 14,
  "tasks": [
    {
      "id": "task-1",
      "day": 1,
      "date": "YYYY-MM-DD",
      "subject": "Subject Name",
      "topic": "Specific Topic",
      "startTime": "${studyStartTime}",
      "endTime": "10:30 AM",
      "timeSlot": "${studyStartTime} - 10:30 AM",
      "durationMinutes": 90,
      "priority": "high",
      "isRevision": false,
      "isPractice": false,
      "guidance": "Specific advice on what exercises or concepts to target",
      "materialId": "optional material ID if grounded in an included material",
      "materialName": "optional material name if grounded in an included material"
    }
  ]
}`;

    let materialsContext = "";
    if (includedMaterials.length > 0) {
      materialsContext =
        "\nIncluded Study Materials available to student:\n" +
        includedMaterials
          .map(
            (m) =>
              `- [ID: ${m.id || ""}] ${m.name || "Material"} (${m.type || "Document"}, Subject: ${m.subject || "General"})${m.description ? `: ${m.description}` : ""}`
          )
          .join("\n");
    }

    const prompt = `Exam Name: ${examName}
Exam Date: ${examDate}
Subjects to cover: ${subjects.join(", ") || "Main subjects"}
Subject difficulties: ${JSON.stringify(difficulties)}
Daily Study Window: Strictly from ${studyStartTime} to ${studyEndTime} (${availableHoursPerDay} hours per day)
Topics / Syllabus Details:
${topicsToComplete || "All core syllabus topics"}${materialsContext}
Generate an optimal schedule with between 8 and 24 actionable study tasks falling strictly between ${studyStartTime} and ${studyEndTime}.`;

    const { response, modelUsed } = await generateContentWithFallback({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.4
      }
    });

    const parsed = cleanAndParseJson(response.text, { planSummary: "Study Schedule", tasks: [] });
    return res.status(200).json({
      success: true,
      plan: parsed,
      modelUsed
    });
  } catch (error) {
    console.error("Gemini chat API failure:", error?.message || "Study plan error");
    return res.status(500).json({
      success: false,
      error: "Unable to generate study plan"
    });
  }
}

// 8. Daily Reflection Analysis
export async function handleReflection(req, res) {
  res.setHeader?.("Content-Type", "application/json");
  if (!checkGeminiApiKey(res)) return;
  const authUser = await requireAuth(req, res);
  if (!authUser) return;

  try {
    const body = parseRequestBody(req);
    const learnedContent = typeof body.learnedContent === "string" ? body.learnedContent.slice(0, 5000) : "";
    const date = typeof body.date === "string" ? body.date : new Date().toISOString().split("T")[0];

    if (!learnedContent.trim()) {
      return res.status(400).json({ success: false, error: "Reflection text cannot be empty." });
    }

    const systemInstruction = `You are an empathetic learning mentor and metacognitive coach.
Analyze the student's daily study journal entry.
Extract insights to strengthen retention, celebrate progress, and identify gaps.
Output strictly JSON:
{
  "summary": "Warm, encouraging 2-sentence summary of what the student accomplished today",
  "keyTakeaway": "The single most impactful conceptual anchor they learned",
  "areasNeedingRevision": ["1-3 specific topics or concepts that could benefit from quick refresher tomorrow"],
  "suggestedNextStep": "A clear, actionable, bite-sized study task to tackle in their next session"
}`;

    const prompt = `Date: ${date}\nStudent's Reflection:\n"""\n${learnedContent}\n"""`;

    const { response, modelUsed } = await generateContentWithFallback({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.5
      }
    });

    const parsed = cleanAndParseJson(response.text, {
      summary: "Completed daily study reflection.",
      keyTakeaway: "Consistent study reflection builds long-term retention.",
      areasNeedingRevision: [],
      suggestedNextStep: "Review key definitions before tomorrow's session."
    });

    return res.status(200).json({
      success: true,
      result: parsed,
      modelUsed
    });
  } catch (error) {
    console.error("Gemini chat API failure:", error?.message || "Reflection error");
    return res.status(500).json({
      success: false,
      error: "Unable to analyze reflection"
    });
  }
}
