import { Matrix } from "@/lib/api/types";

export const makeMatrix = (rows: number, cols: number, fill = ""): Matrix => {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ value: fill })),
  );
};

export const clamp = (n: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, n));
};
