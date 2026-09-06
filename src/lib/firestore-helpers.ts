import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy
} from "firebase/firestore";
import { db, auth } from "./firebase";
import {
  OperationType,
  FirestoreErrorInfo,
  UserProfile,
  ChatSession,
  SmartNote,
  Quiz,
  StudyPlan,
  DailyReflection,
  StudyMaterial
} from "../types";

/**
 * Strict undefined-stripping utility per Production Directives
 * Prevents Firestore driver crashes from undefined object properties
 */
export function stripUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(stripUndefined) as unknown as T;
  }
  if (typeof obj === "object" && !(obj instanceof Date)) {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = stripUndefined(value);
      }
    }
    return cleaned;
  }
  return obj;
}

/**
 * Standardized Firestore error handler per Firebase Skill instructions
 * Throws structured FirestoreErrorInfo and logs technical details to console for debugging
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  // Log technical details only for development/debug
  console.error(`[Firestore Error - ${operationType}] at ${path}:`, JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * User-friendly error message generator
 * Prevents exposing raw Firebase JSON, tokens, or auth internals to the UI
 */
export function getUserFriendlyErrorMessage(error: unknown, fallbackMessage: string): string {
  if (!error) return fallbackMessage;
  const raw = error instanceof Error ? error.message : String(error);

  // If message contains stringified FirestoreErrorInfo, parse it safely
  if (raw.trim().startsWith("{") && raw.includes("authInfo")) {
    try {
      const parsed = JSON.parse(raw);
      const innerErr: string = parsed.error || "";
      if (innerErr.includes("permission-denied") || innerErr.includes("Missing or insufficient permissions")) {
        return "Permission denied. Your session may have expired or access is restricted.";
      }
      if (innerErr.includes("quota-exceeded") || innerErr.includes("Quota exceeded")) {
        return "Database quota limit reached. Please try again later.";
      }
      if (innerErr.includes("offline") || innerErr.includes("unavailable") || innerErr.includes("Failed to get document")) {
        return "Network connection issue. Please check your internet connection.";
      }
    } catch {
      // ignore
    }
    return fallbackMessage;
  }

  // Guard against any raw auth/token leakage in UI
  if (raw.includes("authInfo") || raw.includes("providerId") || raw.includes("apiKey") || raw.includes("token")) {
    return fallbackMessage;
  }

  if (raw.includes("Missing or insufficient permissions") || raw.includes("permission-denied")) {
    return "Permission denied. You can only access your own private study data.";
  }
  if (raw.includes("quota-exceeded") || raw.includes("Quota exceeded")) {
    return "Daily database quota limit reached. Please try again later.";
  }
  if (raw.includes("the client is offline") || raw.includes("Failed to get document because the client is offline")) {
    return "Database client is offline. Please check your internet connection.";
  }

  // Accept clean, short human-readable errors
  if (raw.length < 80 && !raw.includes("{") && !raw.includes("FirebaseError:") && !raw.includes("segment")) {
    return raw;
  }

  return fallbackMessage;
}

// ---------------------------------------------------------------------------
// 1. User Profile: users/{userId}
// ---------------------------------------------------------------------------
export async function saveUserProfile(user: UserProfile): Promise<void> {
  if (!user?.uid) return;
  const path = `users/${user.uid}`;
  try {
    const userCol = collection(db, "users");
    const docRef = doc(userCol, user.uid);
    const data = stripUndefined({
      ...user,
      updatedAt: serverTimestamp(),
    });
    await setDoc(docRef, data, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// ---------------------------------------------------------------------------
// 2. AI Study Chat: users/{userId}/chats/{chatId}
// ---------------------------------------------------------------------------
export async function saveChatSession(userId: string, chat: ChatSession): Promise<ChatSession> {
  if (!userId) {
    throw new Error("User ID is required to save chat session.");
  }
  const chatsCol = collection(db, "users", userId, "chats");
  const docRef = chat.id && chat.id.trim() !== "" ? doc(chatsCol, chat.id.trim()) : doc(chatsCol);
  const chatId = docRef.id;
  const path = `users/${userId}/chats/${chatId}`;

  const resolvedChat: ChatSession = {
    ...chat,
    id: chatId,
  };

  try {
    const data = stripUndefined({
      ...resolvedChat,
      updatedAt: serverTimestamp(),
      createdAt: chat.createdAt || serverTimestamp(),
    });
    await setDoc(docRef, data, { merge: true });
    return resolvedChat;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function fetchUserChats(userId: string): Promise<ChatSession[]> {
  if (!userId) return [];
  const path = `users/${userId}/chats`;
  try {
    const chatsCol = collection(db, "users", userId, "chats");
    const q = query(chatsCol, orderBy("updatedAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as ChatSession));
  } catch (err) {
    try {
      const chatsCol = collection(db, "users", userId, "chats");
      const snapshot = await getDocs(chatsCol);
      const items = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as ChatSession));
      return items.sort((a, b) => {
        const timeA = typeof a.updatedAt === "number" ? a.updatedAt : (a.createdAt || 0);
        const timeB = typeof b.updatedAt === "number" ? b.updatedAt : (b.createdAt || 0);
        return timeB - timeA;
      });
    } catch (fallbackErr) {
      handleFirestoreError(fallbackErr, OperationType.LIST, path);
    }
  }
}

export async function deleteUserChat(userId: string, chatId: string): Promise<void> {
  if (!userId || !chatId || !chatId.trim()) return;
  const path = `users/${userId}/chats/${chatId}`;
  try {
    const chatsCol = collection(db, "users", userId, "chats");
    const docRef = doc(chatsCol, chatId.trim());
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// ---------------------------------------------------------------------------
// 3. Smart Notes: users/{userId}/notes/{noteId}
// ---------------------------------------------------------------------------
export async function saveUserNote(userId: string, note: SmartNote): Promise<SmartNote> {
  if (!userId) {
    throw new Error("User ID is required to save note.");
  }
  const notesCol = collection(db, "users", userId, "notes");
  const docRef = note.id && note.id.trim() !== "" ? doc(notesCol, note.id.trim()) : doc(notesCol);
  const noteId = docRef.id;
  const path = `users/${userId}/notes/${noteId}`;

  const resolvedNote: SmartNote = {
    ...note,
    id: noteId,
  };

  try {
    const data = stripUndefined({
      ...resolvedNote,
      createdAt: note.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(docRef, data, { merge: true });
    return resolvedNote;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function fetchUserNotes(userId: string): Promise<SmartNote[]> {
  if (!userId) return [];
  const path = `users/${userId}/notes`;
  try {
    const notesCol = collection(db, "users", userId, "notes");
    const q = query(notesCol, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as SmartNote));
  } catch (err) {
    try {
      const notesCol = collection(db, "users", userId, "notes");
      const snapshot = await getDocs(notesCol);
      const items = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as SmartNote));
      return items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } catch (fallbackErr) {
      handleFirestoreError(fallbackErr, OperationType.LIST, path);
    }
  }
}

export async function deleteUserNote(userId: string, noteId: string): Promise<void> {
  if (!userId || !noteId || !noteId.trim()) return;
  const path = `users/${userId}/notes/${noteId}`;
  try {
    const notesCol = collection(db, "users", userId, "notes");
    const docRef = doc(notesCol, noteId.trim());
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// ---------------------------------------------------------------------------
// 4. Quizzes: users/{userId}/quizzes/{quizId}
// ---------------------------------------------------------------------------
export async function saveUserQuiz(userId: string, quiz: Quiz): Promise<Quiz> {
  if (!userId) {
    throw new Error("User ID is required to save quiz.");
  }
  const quizzesCol = collection(db, "users", userId, "quizzes");
  const docRef = quiz.id && quiz.id.trim() !== "" ? doc(quizzesCol, quiz.id.trim()) : doc(quizzesCol);
  const quizId = docRef.id;
  const path = `users/${userId}/quizzes/${quizId}`;

  const resolvedQuiz: Quiz = {
    ...quiz,
    id: quizId,
  };

  try {
    const data = stripUndefined({
      ...resolvedQuiz,
      createdAt: quiz.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(docRef, data, { merge: true });
    return resolvedQuiz;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function fetchUserQuizzes(userId: string): Promise<Quiz[]> {
  if (!userId) return [];
  const path = `users/${userId}/quizzes`;
  try {
    const quizzesCol = collection(db, "users", userId, "quizzes");
    const q = query(quizzesCol, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Quiz));
  } catch (err) {
    try {
      const quizzesCol = collection(db, "users", userId, "quizzes");
      const snapshot = await getDocs(quizzesCol);
      const items = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Quiz));
      return items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } catch (fallbackErr) {
      handleFirestoreError(fallbackErr, OperationType.LIST, path);
    }
  }
}

export async function deleteUserQuiz(userId: string, quizId: string): Promise<void> {
  if (!userId || !quizId || !quizId.trim()) return;
  const path = `users/${userId}/quizzes/${quizId}`;
  try {
    const quizzesCol = collection(db, "users", userId, "quizzes");
    const docRef = doc(quizzesCol, quizId.trim());
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// ---------------------------------------------------------------------------
// 5. Study Plans: users/{userId}/studyPlans/{planId}
// ---------------------------------------------------------------------------
export async function saveUserStudyPlan(userId: string, plan: StudyPlan): Promise<StudyPlan> {
  if (!userId) {
    throw new Error("User ID is required to save study plan.");
  }
  const plansCol = collection(db, "users", userId, "studyPlans");
  const docRef = plan.id && plan.id.trim() !== "" ? doc(plansCol, plan.id.trim()) : doc(plansCol);
  const planId = docRef.id;
  const path = `users/${userId}/studyPlans/${planId}`;

  const resolvedPlan: StudyPlan = {
    ...plan,
    id: planId,
  };

  try {
    const data = stripUndefined({
      ...resolvedPlan,
      createdAt: plan.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(docRef, data, { merge: true });
    return resolvedPlan;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function fetchUserStudyPlans(userId: string): Promise<StudyPlan[]> {
  if (!userId) return [];
  const path = `users/${userId}/studyPlans`;
  try {
    const plansCol = collection(db, "users", userId, "studyPlans");
    const q = query(plansCol, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as StudyPlan));
  } catch (err) {
    try {
      const plansCol = collection(db, "users", userId, "studyPlans");
      const snapshot = await getDocs(plansCol);
      const items = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as StudyPlan));
      return items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } catch (fallbackErr) {
      handleFirestoreError(fallbackErr, OperationType.LIST, path);
    }
  }
}

export async function deleteUserStudyPlan(userId: string, planId: string): Promise<void> {
  if (!userId || !planId || !planId.trim()) return;
  const path = `users/${userId}/studyPlans/${planId}`;
  try {
    const plansCol = collection(db, "users", userId, "studyPlans");
    const docRef = doc(plansCol, planId.trim());
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// ---------------------------------------------------------------------------
// 6. Daily Reflections: users/{userId}/reflections/{reflectionId}
// ---------------------------------------------------------------------------
export async function saveUserReflection(userId: string, reflection: DailyReflection): Promise<DailyReflection> {
  if (!userId) {
    throw new Error("User ID is required to save reflection.");
  }
  const reflectionsCol = collection(db, "users", userId, "reflections");
  const docRef = reflection.id && reflection.id.trim() !== "" ? doc(reflectionsCol, reflection.id.trim()) : doc(reflectionsCol);
  const reflectionId = docRef.id;
  const path = `users/${userId}/reflections/${reflectionId}`;

  const resolvedReflection: DailyReflection = {
    ...reflection,
    id: reflectionId,
  };

  try {
    const data = stripUndefined({
      ...resolvedReflection,
      createdAt: reflection.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(docRef, data, { merge: true });
    return resolvedReflection;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function fetchUserReflections(userId: string): Promise<DailyReflection[]> {
  if (!userId) return [];
  const path = `users/${userId}/reflections`;
  try {
    const reflectionsCol = collection(db, "users", userId, "reflections");
    const q = query(reflectionsCol, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as DailyReflection));
  } catch (err) {
    try {
      const reflectionsCol = collection(db, "users", userId, "reflections");
      const snapshot = await getDocs(reflectionsCol);
      const items = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as DailyReflection));
      return items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } catch (fallbackErr) {
      handleFirestoreError(fallbackErr, OperationType.LIST, path);
    }
  }
}

export async function deleteUserReflection(userId: string, reflectionId: string): Promise<void> {
  if (!userId || !reflectionId || !reflectionId.trim()) return;
  const path = `users/${userId}/reflections/${reflectionId}`;
  try {
    const reflectionsCol = collection(db, "users", userId, "reflections");
    const docRef = doc(reflectionsCol, reflectionId.trim());
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// ---------------------------------------------------------------------------
// 7. Study Materials: users/{userId}/studyMaterials/{materialId}
// ---------------------------------------------------------------------------
export async function saveUserStudyMaterial(userId: string, material: StudyMaterial): Promise<StudyMaterial> {
  if (!userId) {
    throw new Error("User ID is required to save study material.");
  }
  const materialsCol = collection(db, "users", userId, "studyMaterials");
  const docRef = material.id && material.id.trim() !== "" ? doc(materialsCol, material.id.trim()) : doc(materialsCol);
  const materialId = docRef.id;
  const path = `users/${userId}/studyMaterials/${materialId}`;

  const resolvedMaterial: StudyMaterial = {
    ...material,
    id: materialId,
    userId,
  };

  try {
    const data = stripUndefined({
      ...resolvedMaterial,
      createdAt: material.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(docRef, data, { merge: true });
    return resolvedMaterial;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function fetchUserStudyMaterials(userId: string): Promise<StudyMaterial[]> {
  if (!userId) return [];
  const path = `users/${userId}/studyMaterials`;
  try {
    const materialsCol = collection(db, "users", userId, "studyMaterials");
    const q = query(materialsCol, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as StudyMaterial));
  } catch (err) {
    try {
      const materialsCol = collection(db, "users", userId, "studyMaterials");
      const snapshot = await getDocs(materialsCol);
      const items = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as StudyMaterial));
      return items.sort((a, b) => {
        const timeA = typeof a.createdAt === "number" ? a.createdAt : (a.updatedAt || 0);
        const timeB = typeof b.createdAt === "number" ? b.createdAt : (b.updatedAt || 0);
        return timeB - timeA;
      });
    } catch (fallbackErr) {
      handleFirestoreError(fallbackErr, OperationType.LIST, path);
    }
  }
}

export async function fetchUserStudyMaterialById(userId: string, materialId: string): Promise<StudyMaterial | null> {
  if (!userId || !materialId) return null;
  const path = `users/${userId}/studyMaterials/${materialId}`;
  try {
    const docRef = doc(db, "users", userId, "studyMaterials", materialId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as StudyMaterial;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function deleteUserStudyMaterial(userId: string, materialId: string): Promise<void> {
  if (!userId || !materialId || !materialId.trim()) return;
  const path = `users/${userId}/studyMaterials/${materialId}`;
  try {
    const materialsCol = collection(db, "users", userId, "studyMaterials");
    const docRef = doc(materialsCol, materialId.trim());
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// ---------------------------------------------------------------------------
// 8. User Settings (e.g. Study Instructions): users/{userId}/settings/studyInstructions
// ---------------------------------------------------------------------------
export async function saveUserStudyInstructions(userId: string, instructions: string): Promise<void> {
  if (!userId) return;
  const path = `users/${userId}/settings/studyInstructions`;
  try {
    const docRef = doc(db, "users", userId, "settings", "studyInstructions");
    await setDoc(docRef, {
      instructions: stripUndefined(instructions),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function fetchUserStudyInstructions(userId: string): Promise<string> {
  if (!userId) return "";
  const path = `users/${userId}/settings/studyInstructions`;
  try {
    const docRef = doc(db, "users", userId, "settings", "studyInstructions");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data()?.instructions || "";
    }
    return "";
  } catch (err) {
    console.warn("Could not load study instructions setting:", err);
    return "";
  }
}

// ---------------------------------------------------------------------------
// 9. Custom User Subjects: users/{userId}/settings/subjects
// ---------------------------------------------------------------------------
export async function saveUserCustomSubjects(userId: string, subjects: string[]): Promise<void> {
  if (!userId) return;
  const path = `users/${userId}/settings/subjects`;
  try {
    const docRef = doc(db, "users", userId, "settings", "subjects");
    await setDoc(
      docRef,
      {
        subjects: stripUndefined(subjects),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function fetchUserCustomSubjects(userId: string): Promise<string[]> {
  if (!userId) return [];
  const path = `users/${userId}/settings/subjects`;
  try {
    const docRef = doc(db, "users", userId, "settings", "subjects");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data?.subjects)) {
        return data.subjects.filter((s: any) => typeof s === "string" && s.trim().length > 0);
      }
    }
    return [];
  } catch (err) {
    console.warn("Could not load custom subjects setting:", err);
    return [];
  }
}



