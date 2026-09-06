import { SourceMode, AnswerFormat, StudyMaterial, ReferencedSource } from "../types";
import { auth } from "./firebase";

export interface GroundedChatResponse {
  success?: boolean;
  reply: string;
  response?: string;
  referencedSources?: ReferencedSource[];
  modelUsed?: string;
  sourceMode?: SourceMode;
  answerFormat?: AnswerFormat;
}

/**
 * Retrieves the current user's Firebase ID token and generates authorization headers.
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  try {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }
  } catch (err) {
    console.warn("Could not attach Firebase auth token:", err);
  }
  return headers;
}

/**
 * Safely executes API requests, protecting against non-JSON / HTML 404 / 500 error pages.
 */
async function safeApiCall<T = any>(
  endpoint: string,
  payload: any,
  defaultErrorMessage: string
): Promise<T> {
  const headers = await getAuthHeaders();
  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  } catch (networkErr: any) {
    throw new Error(`Network error: Unable to reach ${endpoint}. Please check your connection.`);
  }

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  // Prevent SyntaxError: Unexpected token 'T', "The page c"...
  if (!isJson) {
    if (response.status === 404) {
      throw new Error(
        `Backend endpoint ${endpoint} was not found (404). Please ensure Vercel Serverless Functions are deployed.`
      );
    }
    throw new Error(
      `Server returned unexpected ${response.status} (${response.statusText || "Non-JSON response"}).`
    );
  }

  let data: any;
  try {
    data = await response.json();
  } catch (jsonErr: any) {
    throw new Error(`Failed to parse response from ${endpoint}: Invalid JSON format.`);
  }

  if (!response.ok || data?.success === false) {
    throw new Error(data?.error || defaultErrorMessage);
  }

  return data as T;
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
  return safeApiCall<GroundedChatResponse>(
    "/api/gemini/chat",
    {
      messages,
      subject,
      sourceMode: options?.sourceMode || "gemini_only",
      studyInstructions: options?.studyInstructions || "",
      answerFormat: options?.answerFormat || "text",
      selectedMaterials: options?.selectedMaterials || [],
    },
    "Failed to get response from Gemini Study Chat"
  );
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
  return safeApiCall(
    "/api/materials/process",
    payload,
    "Failed to process and index study material"
  );
}

export async function generateSmartNotes(subject: string, topic: string, content: string) {
  return safeApiCall(
    "/api/gemini/notes",
    { subject, topic, content },
    "Failed to generate smart notes"
  );
}

export async function generateQuiz(payload: {
  subject: string;
  topic: string;
  content?: string;
  numQuestions: number;
  difficulty: "easy" | "medium" | "hard";
  questionType: "mcq" | "true_false" | "short_answer";
}) {
  return safeApiCall(
    "/api/gemini/quiz",
    payload,
    "Failed to generate quiz questions"
  );
}

export async function evaluateQuizFeedback(payload: {
  subject: string;
  topic: string;
  score: number;
  totalQuestions: number;
  questions: any[];
  answers: Record<number, string>;
}) {
  return safeApiCall(
    "/api/gemini/quiz-feedback",
    payload,
    "Failed to evaluate quiz feedback"
  );
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
  return safeApiCall(
    "/api/gemini/study-plan",
    payload,
    "Failed to generate study plan"
  );
}

export async function analyzeDailyReflection(learnedContent: string, date: string) {
  return safeApiCall(
    "/api/gemini/reflection",
    { learnedContent, date },
    "Failed to analyze reflection"
  );
}
