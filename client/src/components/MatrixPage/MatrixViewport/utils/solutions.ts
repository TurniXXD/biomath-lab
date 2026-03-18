import { math } from "@/lib/math";
import { FractionMatrix } from "@/components/MatrixPage/types";
import { Fraction } from "mathjs";
import { isZero } from "@/components/MatrixPage/MatrixViewport/utils/utils";

type SolveKind = "no-solution" | "unique" | "infinite";

type SolveResult = {
  kind: SolveKind;
  rref: FractionMatrix;

  // x in R^n (n variables)
  particular?: Fraction[]; // x_p
  nullspaceBasis: Fraction[][]; // vectors v_i in R^n

  pivotCols: number[];
  freeCols: number[];
  // for rendering:
  general?: {
    particular: Fraction[];
    directions: Fraction[][]; // same as nullspaceBasis
  };
};

const getFreeCols = (nVars: number, pivotCols: number[]) => {
  const piv = new Set(pivotCols);
  const free: number[] = [];

  for (let c = 0; c < nVars; c += 1) {
    if (!piv.has(c)) {
      free.push(c);
    }
  }

  return free;
};

// expects rref of augmented [A|b]
// nVars = number of variable columns in A (excluding last column b)
export const solveAugmentedRref = (
  rref: FractionMatrix,
  pivotCols: number[],
  nVars: number,
): SolveResult => {
  const m = rref.length;
  const nAug = rref[0]?.length ?? 0;
  const bCol = nAug - 1;

  const freeCols = getFreeCols(nVars, pivotCols);

  // Check inconsistency: row like [0 0 ... 0 | 1]
  for (let i = 0; i < m; i += 1) {
    let allZero = true;

    for (let j = 0; j < nVars; j += 1) {
      if (!isZero(rref[i][j])) {
        allZero = false;
        break;
      }
    }

    if (allZero && !isZero(rref[i][bCol])) {
      return {
        kind: "no-solution",
        rref,
        nullspaceBasis: [],
        pivotCols,
        freeCols,
      };
    }
  }

  // Build a particular solution by setting free vars = 0
  const xp: Fraction[] = Array.from(
    { length: nVars },
    () => math.fraction(0) as Fraction,
  );

  // Each pivot variable x_pivot = b - sum_{free} coeff*free
  // With free=0 => x_pivot = b
  for (let row = 0; row < m; row += 1) {
    // find pivot col in this row (first 1 among variable cols)
    let pivCol = -1;

    for (let c = 0; c < nVars; c += 1) {
      if (!isZero(rref[row][c])) {
        // in RREF, pivot should be 1 and first nonzero
        pivCol = c;
        break;
      }
    }

    if (pivCol === -1) {
      continue;
    }

    xp[pivCol] = rref[row][bCol];
  }

  // Nullspace basis vectors from RREF of A part:
  // For each free variable f, set x_f = 1, other free vars 0, then solve pivot vars.
  const basis: Fraction[][] = [];

  for (const f of freeCols) {
    const v: Fraction[] = Array.from(
      { length: nVars },
      () => math.fraction(0) as Fraction,
    );
    v[f] = math.fraction(1) as Fraction;

    // pivot vars: x_p = - (coeff of free col in that pivot row)
    for (let row = 0; row < m; row += 1) {
      let pivCol = -1;

      for (let c = 0; c < nVars; c += 1) {
        if (!isZero(rref[row][c])) {
          pivCol = c;
          break;
        }
      }

      if (pivCol === -1) {
        continue;
      }

      const coeff = rref[row][f];
      if (!isZero(coeff)) {
        v[pivCol] = math.unaryMinus(coeff as any) as any;
      }
    }

    basis.push(v);
  }

  if (freeCols.length === 0) {
    return {
      kind: "unique",
      rref,
      particular: xp,
      nullspaceBasis: [],
      pivotCols,
      freeCols,
      general: {
        particular: xp,
        directions: [],
      },
    };
  }

  return {
    kind: "infinite",
    rref,
    particular: xp,
    nullspaceBasis: basis,
    pivotCols,
    freeCols,
    general: {
      particular: xp,
      directions: basis,
    },
  };
};
