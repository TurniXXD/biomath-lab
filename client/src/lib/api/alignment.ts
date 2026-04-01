import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { axiosInstance } from "@/lib/api/client";

export type AlignmentMode = "global" | "local";

export type AlignmentScoring = {
  match_score: number;
  mismatch_score: number;
  gap_penalty: number;
};

export type AlignmentAlignRequest = {
  sequence_a: string;
  sequence_b: string;
  mode: AlignmentMode;
  scoring: AlignmentScoring;
};

export type AlignmentAlignResponse = {
  mode: AlignmentMode;
  sequence_a: string;
  sequence_b: string;
  scoring: AlignmentScoring;
  result: {
    aligned_a: string;
    aligned_b: string;
    score: number;
    start_a: number;
    end_a: number;
    start_b: number;
    end_b: number;
    operations: string[];
  };
};

const postJson = <TData>(url: string, body: unknown) => {
  return axiosInstance<TData>(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
};

export const alignSequences = (payload: AlignmentAlignRequest) => {
  return postJson<AlignmentAlignResponse>("/alignment/align", payload);
};

export const useAlignmentAlignQuery = (
  payload: AlignmentAlignRequest | null,
  enabled = true,
): UseQueryResult<AlignmentAlignResponse, Error> => {
  return useQuery({
    queryKey: ["alignment", "align", payload],
    queryFn: () => {
      if (!payload) {
        throw new Error("Missing alignment request");
      }

      return alignSequences(payload);
    },
    enabled: enabled && Boolean(payload),
  });
};
