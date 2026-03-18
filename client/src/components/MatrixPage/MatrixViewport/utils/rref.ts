import type { Fraction } from "mathjs";
import { math } from "@/lib/math"; // your create(all,{number:"Fraction"}) instance

import { FractionMatrix } from "@/components/MatrixPage/types";
import {
  isZero,
  makeCell,
} from "@/components/MatrixPage/MatrixViewport/utils/utils";
import { Matrix } from "@/lib/api/types";

type RrefResult = {
  rref: FractionMatrix;
  pivotCols: number[]; // pivot column index per pivot row
  pivotRows: number[]; // pivot row indices
};

const cloneFrac = (A: FractionMatrix) => {
  return A.map((r) => r.map((x) => math.fraction(x) as Fraction));
};

export const rrefFractions = (Ain: FractionMatrix): RrefResult => {
  const A = cloneFrac(Ain);
  const m = A.length;
  const n = A[0]?.length ?? 0;

  const pivotCols: number[] = [];
  const pivotRows: number[] = [];

  let r = 0;

  for (let c = 0; c < n && r < m; c += 1) {
    // Find pivot row >= r with nonzero in column c
    let pivot = -1;
    for (let i = r; i < m; i += 1) {
      if (!isZero(A[i][c])) {
        pivot = i;
        break;
      }
    }

    if (pivot === -1) {
      continue;
    }

    // Swap pivot row into position r
    if (pivot !== r) {
      const tmp = A[r];
      A[r] = A[pivot];
      A[pivot] = tmp;
    }

    // Normalize row r so pivot becomes 1
    const pivVal = A[r][c];
    for (let j = c; j < n; j += 1) {
      A[r][j] = math.divide(A[r][j] as any, pivVal as any) as any;
    }

    // Eliminate column c in all other rows
    for (let i = 0; i < m; i += 1) {
      if (i === r) {
        continue;
      }

      const factor = A[i][c];
      if (isZero(factor)) {
        continue;
      }

      for (let j = c; j < n; j += 1) {
        const sub = math.multiply(factor as any, A[r][j] as any) as any;
        A[i][j] = math.subtract(A[i][j] as any, sub) as any;
      }
    }

    pivotCols.push(c);
    pivotRows.push(r);
    r += 1;
  }

  return { rref: A, pivotCols, pivotRows };
};

export const fractionMatrixToCells = (M: FractionMatrix): Matrix => {
  return M.map((row) => row.map((cell) => makeCell(math.format(cell))));
};
