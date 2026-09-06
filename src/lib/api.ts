import { SourceMode, AnswerFormat, StudyMaterial, ReferencedSource } from "../types";

export interface GroundedChatResponse {
  reply: string;
  referencedSources?: ReferencedSource[];
  modelUsed?: string;
  sourceMode?: SourceMode;
  answerFormat?: AnswerFormat;
}

export async function askStudyChat(
  messages: { role: "user" | "model"; text: string }[],
  subject?: string,
  options?: {
    sourceMode?: SourceMode;
    studyInstructions?: string;
    answerFormat?: AnswerFormat;
    selectedMaterials?: StudyMaterial[];
  }
): Promise<GroundedChatResponse> {
  const response = await fetch("/api/gemini/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      subject,
      sourceMode: options?.sourceMode || "gemini_only",
      studyInstructions: options?.studyInstructions || "",
      answerFormat: options?.answerFormat || "text",
      selectedMaterials: options?.selectedMaterials || [],
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to get response from Gemini Study Chat");
  }
  return data;
}

export async function processStudyMaterial(payload: {
  materialId?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  subject: string;
  materialType: string;
  base64Content?: string;
  textContent?: string;
}) {
  const response = await fetch("/api/materials/process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to process and index study material");
  }
  return data;
}

export async function generateSmartNotes(subject: string, topic: string, content: string) {
  const response = await fetch("/api/gemini/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subject, topic, content }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to generate smart notes");
  }
  return data;
}

export async function generateQuiz(payload: {
  subject: string;
  topic: string;
  content?: string;
  numQuestions: number;
  difficulty: "easy" | "medium" | "hard";
  questionType: "mcq" | "true_false" | "short_answer";
}) {
  const response = await fetch("/api/gemini/quiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to generate quiz questions");
  }
  return data;
}

export async function evaluateQuizFeedback(payload: {
  subject: string;
  topic: string;
  score: number;
  totalQuestions: number;
  questions: any[];
  answers: Record<number, string>;
}) {
  const response = await fetch("/api/gemini/quiz-feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to evaluate quiz feedback");
  }
  return data;
}

export async function generateStudyPlan(payload: {
  examName: string;
  examDate: string;
  subjects: string[];
  availableHoursPerDay: number;
  studyStartTime?: string;
  studyEndTime?: string;
  difficulties?: Record<string, string>;
  topicsToComplete?: string;
  includedMaterials?: Array<{
    id: string;
    name: string;
    subject: string;
    type: string;
    description?: string;
  }>;
}) {
  const response = await fetch("/api/gemini/study-plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to generate study plan");
  }
  return data;
}

export async function analyzeDailyReflection(learnedContent: string, date: string) {
  const response = await fetch("/api/gemini/reflection", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ learnedContent, date }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to analyze reflection");
  }
  return data;
}
