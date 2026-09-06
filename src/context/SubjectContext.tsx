import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { fetchUserCustomSubjects, saveUserCustomSubjects } from "../lib/firestore-helpers";

interface SubjectContextType {
  subjects: string[];
  loading: boolean;
  addSubject: (newSubject: string) => Promise<string | null>;
  removeSubject: (subjectToRemove: string) => Promise<void>;
  refreshSubjects: () => Promise<void>;
}

const LOCAL_STORAGE_KEY_PREFIX = "studyvault_custom_subjects_";

const SubjectContext = createContext<SubjectContextType | undefined>(undefined);

export const SubjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  // Strictly start with empty subjects by default (no hardcoded subjects per user directive)
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const storageKey = user ? `${LOCAL_STORAGE_KEY_PREFIX}${user.uid}` : `${LOCAL_STORAGE_KEY_PREFIX}guest`;

  // Load saved subjects from localStorage immediately, then sync with Firestore
  const loadSubjects = useCallback(async () => {
    setLoading(true);
    let initialList: string[] = [];

    // 1. Check localStorage for instant response
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          initialList = parsed.filter((s) => typeof s === "string" && s.trim().length > 0);
          setSubjects(initialList);
        }
      }
    } catch {
      // ignore parsing error
    }

    // 2. Fetch from Firestore if user is authenticated
    if (user) {
      try {
        const remoteSubjects = await fetchUserCustomSubjects(user.uid);
        if (remoteSubjects && remoteSubjects.length > 0) {
          // Merge unique subjects
          const merged = Array.from(new Set([...initialList, ...remoteSubjects]));
          setSubjects(merged);
          try {
            localStorage.setItem(storageKey, JSON.stringify(merged));
          } catch {
            // ignore
          }
        }
      } catch (err) {
        console.warn("Could not sync subjects from Firestore:", err);
      }
    }

    setLoading(false);
  }, [user, storageKey]);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  const addSubject = async (newSubject: string): Promise<string | null> => {
    const cleaned = newSubject.trim();
    if (!cleaned) return null;

    // Check case-insensitive duplicate
    const existing = subjects.find((s) => s.toLowerCase() === cleaned.toLowerCase());
    if (existing) {
      return existing;
    }

    const updated = [...subjects, cleaned];
    setSubjects(updated);

    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // ignore
    }

    if (user) {
      try {
        await saveUserCustomSubjects(user.uid, updated);
      } catch (err) {
        console.warn("Failed to persist subject to Firestore:", err);
      }
    }

    return cleaned;
  };

  const removeSubject = async (subjectToRemove: string): Promise<void> => {
    const updated = subjects.filter((s) => s !== subjectToRemove);
    setSubjects(updated);

    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // ignore
    }

    if (user) {
      try {
        await saveUserCustomSubjects(user.uid, updated);
      } catch (err) {
        console.warn("Failed to update subjects in Firestore:", err);
      }
    }
  };

  return (
    <SubjectContext.Provider
      value={{
        subjects,
        loading,
        addSubject,
        removeSubject,
        refreshSubjects: loadSubjects,
      }}
    >
      {children}
    </SubjectContext.Provider>
  );
};

export const useSubjects = (): SubjectContextType => {
  const context = useContext(SubjectContext);
  if (!context) {
    throw new Error("useSubjects must be used within a SubjectProvider");
  }
  return context;
};
