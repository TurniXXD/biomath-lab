import { Fraction } from "mathjs";
import { math } from "@/lib/math";

import { Matrix } from "@/lib/api/types";
import { MatrixCell } from "@/lib/api/generated/api";

export const isZero = (x: Fraction) => {
  return math.equal(x as any, 0 as any) as unknown as boolean;
};

export const cloneMatrix = (m: Matrix): Matrix => {
  // deep clone cells (important now that cells are objects)
  return m.map((row) => row.map((cell) => ({ ...cell })));
};

export const makeCell = (value: string): MatrixCell => {
  return { value };
};

type ParseFractionMatrixReturnType =
  | { ok: true; value: Fraction[][] }
  | { ok: false; error: string };

export const parseFractionMatrix = (
  m: Matrix,
): ParseFractionMatrixReturnType => {
  if (!m.length || !m[0]?.length) {
    return { ok: false, error: "Matrix is empty." };
  }

  const cols = m[0].length;

  for (const row of m) {
    if (row.length !== cols) {
      return {
        ok: false,
        error: "Jagged matrix (rows with different lengths).",
      };
    }
  }

  const out: Fraction[][] = [];

  for (let r = 0; r < m.length; r++) {
    const row: Fraction[] = [];

    for (let c = 0; c < cols; c++) {
      const raw = m[r][c]?.value ?? "";

      if (/\s/.test(raw)) {
        return {
          ok: false,
          error: `Whitespace is not allowed at (${r + 1}, ${c + 1}).`,
        };
      }

      if (raw === "") {
        return { ok: false, error: `Empty cell at (${r + 1}, ${c + 1}).` };
      }

      const normalized = raw.replace(",", ".");

      try {
        row.push(math.fraction(normalized) as Fraction);
      } catch {
        return {
          ok: false,
          error: `Invalid number "${raw}" at (${r + 1}, ${c + 1}).`,
        };
      }
    }

    out.push(row);
  }

  return { ok: true, value: out };
};

export const fractionMatrixToMatrixCells = (M: Fraction[][]): Matrix => {
  return M.map((row) => row.map((cell) => makeCell(math.format(cell))));
};

type FractionsOperationReturnType =
  | { ok: true; value: Fraction[][] }
  | { ok: false; error: string };

export const addFractions = (
  A: Fraction[][],
  B: Fraction[][],
): FractionsOperationReturnType => {
  if (A.length !== B.length || A[0].length !== B[0].length) {
    return {
      ok: false,
      error: `Addition requires same dimensions, got ${A.length}×${A[0].length} and ${B.length}×${B[0].length}.`,
    };
  }

  return { ok: true, value: math.add(A as any, B as any) as any };
};

export const multiplyFractions = (
  A: Fraction[][],
  B: Fraction[][],
): FractionsOperationReturnType => {
  const m = A.length;
  const n = A[0].length;
  const p = B.length;
  const q = B[0].length;

  if (n !== p) {
    return {
      ok: false,
      error: `Multiplication requires A cols = B rows, got ${m}×${n} and ${p}×${q}.`,
    };
  }

  return { ok: true, value: math.multiply(A as any, B as any) as any };
};
