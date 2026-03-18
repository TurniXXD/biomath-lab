"use client";

import { useMemo } from "react";
import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Text,
  Stack,
  Alert,
  AlertIcon,
  Divider,
  Button,
} from "@chakra-ui/react";
import type { Fraction } from "mathjs";

import { math } from "@/lib/math";
import {
  makeCell,
  parseFractionMatrix,
  fractionMatrixToMatrixCells,
  isZero,
} from "@/components/MatrixPage/MatrixViewport/utils/utils";
import { Matrix } from "@/lib/api/types";
import { MatrixGrid } from "@/components/Matrix/ReadonlyMatrix/MatrixGrid";
import { rrefFractions } from "@/components/MatrixPage/MatrixViewport/utils/rref";
import { matrixToLatex } from "@/utils/parsers/matrixToLatex";

type SolveKind = "no-solution" | "unique" | "infinite";

type SolveResult = {
  kind: SolveKind;
  particular?: Fraction[];
  nullspaceBasis: Fraction[][];
};

type AnalysisResult =
  | { ok: false; error: string }
  | {
      ok: true;
      rrefCells: Matrix;
      kind: SolveKind;
      particular?: Fraction[];
      nullspaceBasis: Fraction[][];
      generalText?: string;
    };

const solveAugmentedFromRref = (
  rref: Fraction[][],
  pivotCols: number[],
  nVars: number,
): SolveResult => {
  const m = rref.length;
  const bCol = rref[0].length - 1;

  for (let i = 0; i < m; i += 1) {
    let allZero = true;

    for (let j = 0; j < nVars; j += 1) {
      if (!isZero(rref[i][j])) {
        allZero = false;
        break;
      }
    }

    if (allZero && !isZero(rref[i][bCol])) {
      return { kind: "no-solution", nullspaceBasis: [] };
    }
  }

  const xp: Fraction[] = Array.from(
    { length: nVars },
    () => math.fraction(0) as Fraction,
  );

  for (let row = 0; row < m; row += 1) {
    let pivCol = -1;

    for (let c = 0; c < nVars; c += 1) {
      if (!isZero(rref[row][c])) {
        pivCol = c;
        break;
      }
    }

    if (pivCol !== -1) {
      xp[pivCol] = rref[row][bCol];
    }
  }

  const piv = new Set(pivotCols);
  const freeCols: number[] = [];

  for (let c = 0; c < nVars; c += 1) {
    if (!piv.has(c)) {
      freeCols.push(c);
    }
  }

  const basis: Fraction[][] = [];

  for (const f of freeCols) {
    const v: Fraction[] = Array.from(
      { length: nVars },
      () => math.fraction(0) as Fraction,
    );
    v[f] = math.fraction(1);

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
        v[pivCol] = math.unaryMinus(coeff as any) as unknown as Fraction;
      }
    }

    basis.push(v);
  }

  if (freeCols.length === 0) {
    return { kind: "unique", particular: xp, nullspaceBasis: [] };
  }

  return { kind: "infinite", particular: xp, nullspaceBasis: basis };
};

const vectorToColumnMatrix = (v: Fraction[]): Matrix => {
  return v.map((x) => [makeCell(math.format(x))]);
};

const basisToMatrices = (basis: Fraction[][]): Matrix[] => {
  return basis.map((v) => vectorToColumnMatrix(v));
};

const formatGeneralSolution = (xp: Fraction[], basis: Fraction[][]) => {
  const xpStr = `[${xp.map((x) => math.format(x)).join(", ")}]`;

  if (basis.length === 0) {
    return `x = ${xpStr}`;
  }

  const terms = basis.map((v, i) => {
    const vStr = `[${v.map((x) => math.format(x)).join(", ")}]`;
    return `t${i + 1}·${vStr}`;
  });

  return `x = ${xpStr} + ${terms.join(" + ")}`;
};

interface ReadonlyMatrixProps {
  m: Matrix;
  isAugmented?: boolean;
  showActionsTabs?: boolean;
}

export const ReadonlyMatrix = ({
  m,
  isAugmented = true,
  showActionsTabs = false,
}: ReadonlyMatrixProps) => {
  const analysis: AnalysisResult = useMemo(() => {
    const parsed = parseFractionMatrix(m);

    if (!parsed.ok) {
      return { ok: false, error: parsed.error };
    }

    const F = parsed.value;
    const rrefRes = rrefFractions(F);
    const rrefCells = fractionMatrixToMatrixCells(rrefRes.rref);

    const nCols = F[0]?.length ?? 0;

    if (!isAugmented) {
      const nVars = nCols;

      const solve = solveAugmentedFromRref(
        rrefRes.rref.map((row) => [...row, math.fraction(0) as Fraction]),
        rrefRes.pivotCols,
        nVars,
      );

      return {
        ok: true,
        rrefCells,
        kind: solve.kind,
        particular: solve.particular,
        nullspaceBasis: solve.nullspaceBasis,
        generalText: solve.particular
          ? formatGeneralSolution(solve.particular, solve.nullspaceBasis)
          : undefined,
      };
    }

    if (nCols < 2) {
      return {
        ok: true,
        rrefCells,
        kind: "no-solution",
        particular: undefined,
        nullspaceBasis: [],
        generalText: undefined,
      };
    }

    const nVars = nCols - 1;

    const solve = solveAugmentedFromRref(
      rrefRes.rref,
      rrefRes.pivotCols,
      nVars,
    );

    return {
      ok: true,
      rrefCells,
      kind: solve.kind,
      particular: solve.particular,
      nullspaceBasis: solve.nullspaceBasis,
      generalText: solve.particular
        ? formatGeneralSolution(solve.particular, solve.nullspaceBasis)
        : undefined,
    };
  }, [m, isAugmented]);

  const copyLatex = async () => {
    const latex = matrixToLatex(m);
    await navigator.clipboard.writeText(latex);
  };

  if (!showActionsTabs) {
    if (!analysis.ok) {
      return (
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          {analysis.error}
        </Alert>
      );
    }

    return (
      <Stack spacing={3}>
        <MatrixGrid m={m} />
        <Button size="sm" variant="outline" onClick={copyLatex}>
          Copy LaTeX
        </Button>
      </Stack>
    );
  }

  return (
    <Tabs size="sm" variant="enclosed">
      <TabList>
        <Tab>Matrix</Tab>
        <Tab>RREF</Tab>
        <Tab>Particular</Tab>
        <Tab>General</Tab>
        <Tab>Null space</Tab>
      </TabList>

      <TabPanels>
        <TabPanel>
          <Stack spacing={3}>
            <MatrixGrid m={m} />
            <Button size="sm" variant="outline" onClick={copyLatex}>
              Copy LaTeX
            </Button>
          </Stack>
        </TabPanel>

        <TabPanel>
          {!analysis.ok && (
            <Alert status="error" borderRadius="lg">
              <AlertIcon />
              {analysis.error}
            </Alert>
          )}

          {analysis.ok && <MatrixGrid m={analysis.rrefCells} />}
        </TabPanel>

        <TabPanel>
          {!analysis.ok && (
            <Alert status="error" borderRadius="lg">
              <AlertIcon />
              {analysis.error}
            </Alert>
          )}

          {analysis.ok && (
            <Stack spacing={3}>
              <Text fontWeight="700">System</Text>
              <Text opacity={0.7}>
                {analysis.kind === "no-solution" && "No solution"}
                {analysis.kind === "unique" && "Unique solution"}
                {analysis.kind === "infinite" && "Infinitely many solutions"}
              </Text>

              <Divider />

              {analysis.particular && (
                <>
                  <Text fontWeight="700">Particular solution xₚ</Text>
                  <MatrixGrid m={vectorToColumnMatrix(analysis.particular)} />
                </>
              )}

              {!analysis.particular && analysis.kind === "no-solution" && (
                <Text opacity={0.7}>No particular solution exists.</Text>
              )}
            </Stack>
          )}
        </TabPanel>

        <TabPanel>
          {!analysis.ok && (
            <Alert status="error" borderRadius="lg">
              <AlertIcon />
              {analysis.error}
            </Alert>
          )}

          {analysis.ok && (
            <Stack spacing={3}>
              <Text fontWeight="700">General solution</Text>

              {analysis.generalText && (
                <Box
                  p={3}
                  borderWidth="1px"
                  borderColor="gray.200"
                  borderRadius="lg"
                  bg="gray.50"
                  fontFamily='ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
                  whiteSpace="pre-wrap"
                >
                  {analysis.generalText}
                </Box>
              )}

              {!analysis.generalText && analysis.kind === "no-solution" && (
                <Text opacity={0.7}>No general solution exists.</Text>
              )}
            </Stack>
          )}
        </TabPanel>

        <TabPanel>
          {!analysis.ok && (
            <Alert status="error" borderRadius="lg">
              <AlertIcon />
              {analysis.error}
            </Alert>
          )}

          {analysis.ok && (
            <Stack spacing={3}>
              <Text fontWeight="700">Null space basis</Text>

              {analysis.nullspaceBasis.length === 0 && (
                <Text opacity={0.7}>
                  {analysis.kind === "unique"
                    ? "Null space is {0}."
                    : "No null space basis computed."}
                </Text>
              )}

              {analysis.nullspaceBasis.length > 0 && (
                <Stack spacing={3}>
                  {basisToMatrices(analysis.nullspaceBasis).map((bm, idx) => (
                    <Box key={idx}>
                      <Text fontSize="sm" opacity={0.8} mb={1}>
                        v{idx + 1}
                      </Text>
                      <MatrixGrid m={bm} />
                    </Box>
                  ))}
                </Stack>
              )}
            </Stack>
          )}
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};
