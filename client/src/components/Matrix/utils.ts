import { Matrix } from "@/lib/api/types";

export const makeIdentityMatrix = (n: number): Matrix => {
  return Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => ({
      value: r === c ? "1" : "0",
    })),
  );
};
