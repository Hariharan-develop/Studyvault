export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface ChatSession {
  id: string;
  title: string;
  subject?: string;
  messages: ChatMessage[];
  sourceMode?: SourceMode;
  answerFormat?: AnswerFormat;
  selectedMaterialIds?: string[];
  createdAt: any;
  updatedAt: any;
}

export interface KeyDefinition {
  term: string;
  definition: string;
}

export interface SmartNote {
  id: string;
  subject: string;
  topic: string;
  rawContent: string;
  summary: string;
  simpleExplanation?: string;
  keyConcepts: string[];
  keyDefinitions: KeyDefinition[];
  importantPoints?: string[];
  revisionPoints: string[];
  createdAt: any;
  updatedAt?: any;
}

export interface QuizQuestion {
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export interface QuizAttempt {
  id: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  answers: Record<number, string>;
  aiFeedback: string;
  completedAt: number;
}

export interface Quiz {
  id: string;
  subject: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  questionType: "mcq" | "true_false" | "short_answer";
  questions: QuizQuestion[];
  attempts: QuizAttempt[];
  createdAt: any;
}

export interface StudyTask {
  id: string;
  day: number;
  date: string;
  subject: string;
  topic: string;
  durationMinutes: number;
  startTime?: string;
  endTime?: string;
  timeSlot?: string;
  priority: "high" | "medium" | "low";
  isRevision: boolean;
  isPractice: boolean;
  guidance?: string;
  completed: boolean;
  materialId?: string;
  materialName?: string;
}

export interface StudyPlan {
  id: string;
  examName: string;
  examDate: string;
  availableHoursPerDay: number;
  studyStartTime?: string;
  studyEndTime?: string;
  studyTimeWindow?: string;
  subjects: string[];
  planSummary?: string;
  tasks: StudyTask[];
  createdAt: any;
  updatedAt?: any;
  includedMaterialIds?: string[];
  includedMaterialNames?: string[];
}

export interface DailyReflection {
  id: string;
  date: string;
  subject?: string;
  learnedContent: string;
  summary: string;
  keyTakeaway: string;
  areasNeedingRevision: string[];
  suggestedNextStep: string;
  createdAt: any;
}

export type ActiveTab =
  | "dashboard"
  | "chat"
  | "materials"
  | "notes"
  | "planner"
  | "reflection"
  | "vault";

export type StudyMaterialType =
  | "Syllabus"
  | "Class Notes"
  | "Textbook / Reference"
  | "Question Bank"
  | "Teacher Notes"
  | "Lecture Slides"
  | "Other";

export interface MaterialChunk {
  id: string;
  materialId: string;
  materialName: string;
  subject: string;
  type: string;
  pageNumber?: number;
  heading?: string;
  chunkIndex: number;
  content: string;
}

export interface StudyMaterial {
  id: string;
  userId: string;
  name: string;
  subject: string;
  type: StudyMaterialType;
  description?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  processingStatus: "processing" | "ready" | "failed";
  errorMessage?: string;
  extractedText?: string;
  fileDataUrl?: string;
  chunkCount: number;
  chunks?: MaterialChunk[];
  createdAt: any;
  updatedAt: any;
}

export type SourceMode = "materials_only" | "materials_plus_gemini" | "gemini_only";
export type AnswerFormat = "text" | "handwritten" | "both";

export interface ReferencedSource {
  materialId: string;
  materialName: string;
  pageNumber?: number;
  section?: string;
  excerpt?: string;
}

export interface HandwrittenPage {
  pageNumber: number;
  totalPages: number;
  title: string;
  subject?: string;
  lines: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: number;
  referencedSources?: ReferencedSource[];
  sourceMode?: SourceMode;
  answerFormat?: AnswerFormat;
  handwrittenPages?: HandwrittenPage[];
  modelUsed?: string;
}

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}
