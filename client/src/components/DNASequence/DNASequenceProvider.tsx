"use client";

import { useSession } from "next-auth/react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  useLatestDNASequenceQuery,
  useSaveDNASequenceMutation,
  type DNASequenceCreate,
} from "@/lib/api/generated/backend";

type DNASequenceContextValue = {
  sequence: string;
  name: string;
  source: string;
  savedRecordId: number | null;
  savedAt: string | null;
  isHydrated: boolean;
  isLoadingRemote: boolean;
  isSaving: boolean;
  error: string | null;
  email: string | null;
  setSequence: (sequence: string) => void;
  setName: (name: string) => void;
  setSource: (source: string) => void;
  restoreFromFile: (file: File) => Promise<void>;
  saveSequence: () => Promise<void>;
  clearSequence: () => void;
};

const DNASequenceContext = createContext<DNASequenceContextValue | null>(null);

const STORAGE_KEY = "biomath-lab:dna-sequence-draft";

const sanitizeSequence = (value: string) => {
  return value.toUpperCase().replace(/[^ACGTN]/g, "");
};

const stripFastaHeaders = (value: string) => {
  return value
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith(">"))
    .join("");
};

export function DNASequenceProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [sequence, setSequence] = useState("");
  const [name, setName] = useState("");
  const [source, setSource] = useState("");
  const [savedRecordId, setSavedRecordId] = useState<number | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const email = session?.user?.email ?? null;
  const latestSequenceQuery = useLatestDNASequenceQuery(
    email,
    status === "authenticated",
  );
  const saveSequenceMutation = useSaveDNASequenceMutation();
  const isLoadingRemote = latestSequenceQuery.isFetching;
  const isSaving = saveSequenceMutation.isPending;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setIsHydrated(true);
      return;
    }

    try {
      const parsed = JSON.parse(stored) as {
        sequence?: string;
        name?: string;
        source?: string;
      };

      if (typeof parsed.sequence === "string") {
        setSequence(sanitizeSequence(parsed.sequence));
      }
      if (typeof parsed.name === "string") {
        setName(parsed.name);
      }
      if (typeof parsed.source === "string") {
        setSource(parsed.source);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        sequence,
        name,
        source,
      }),
    );
  }, [isHydrated, sequence, name, source]);

  useEffect(() => {
    if (!latestSequenceQuery.data?.sequence) {
      return;
    }

    const sequenceRecord = latestSequenceQuery.data.sequence;

    setSequence(sanitizeSequence(sequenceRecord.sequence));
    setName(sequenceRecord.name ?? "");
    setSource(sequenceRecord.source ?? "");
    setSavedRecordId(sequenceRecord.id);
    setSavedAt(sequenceRecord.updated_at);
    setError(null);
  }, [latestSequenceQuery.data, setName, setSequence, setSource]);

  useEffect(() => {
    if (!latestSequenceQuery.error) {
      return;
    }

    setError(
      latestSequenceQuery.error instanceof Error
        ? latestSequenceQuery.error.message
        : "Failed to load the saved DNA sequence.",
    );
  }, [latestSequenceQuery.error]);

  useEffect(() => {
    if (saveSequenceMutation.error) {
      setError(
        saveSequenceMutation.error instanceof Error
          ? saveSequenceMutation.error.message
          : "Failed to save the DNA sequence.",
      );
    }
  }, [saveSequenceMutation.error]);

  const restoreFromFile = async (file: File) => {
    const contents = await file.text();
    const cleaned = sanitizeSequence(stripFastaHeaders(contents));
    setSequence(cleaned);
    setName(file.name.replace(/\.[^.]+$/, ""));
    setSource(file.name);
  };

  const saveSequence = async () => {
    if (!email) {
      setError("Sign in to save the active DNA sequence.");
      return;
    }

    if (!sequence.trim()) {
      setError("Upload or paste a DNA sequence before saving.");
      return;
    }

    setError(null);

    try {
      const payload = await saveSequenceMutation.mutateAsync({
        email,
        name: name.trim() || null,
        sequence: sanitizeSequence(sequence),
        source: source.trim() || window.location.pathname,
      } satisfies DNASequenceCreate);

      setSavedRecordId(payload.id);
      setSavedAt(payload.updated_at);
      setSequence(sanitizeSequence(payload.sequence));
      setName(payload.name ?? "");
      setSource(payload.source ?? "");
    } catch {
      // handled by the mutation error state
    }
  };

  const clearSequence = () => {
    setSequence("");
    setName("");
    setSource("");
    setSavedRecordId(null);
    setSavedAt(null);
    setError(null);
  };

  const value = useMemo<DNASequenceContextValue>(() => {
    return {
      sequence,
      name,
      source,
      savedRecordId,
      savedAt,
      isHydrated,
      isLoadingRemote,
      isSaving,
      error,
      email,
      setSequence: (nextSequence: string) => {
        setSequence(sanitizeSequence(nextSequence));
      },
      setName,
      setSource,
      restoreFromFile,
      saveSequence,
      clearSequence,
    };
  }, [
    clearSequence,
    email,
    error,
    isHydrated,
    isLoadingRemote,
    isSaving,
    name,
    restoreFromFile,
    saveSequence,
    savedAt,
    savedRecordId,
    sequence,
    source,
  ]);

  return (
    <DNASequenceContext.Provider value={value}>
      {children}
    </DNASequenceContext.Provider>
  );
}

export const useDNASequence = () => {
  const context = useContext(DNASequenceContext);

  if (!context) {
    throw new Error("useDNASequence must be used within DNASequenceProvider");
  }

  return context;
};
