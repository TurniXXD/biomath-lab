import { makeCell } from "@/components/MatrixPage/MatrixViewport/utils/utils";
import { MatrixCell } from "@/lib/api/generated/api";
import { Matrix } from "@/lib/api/types";

type LatexToMatrixReturnType =
  | { ok: true; value: Matrix }
  | { ok: false; error: string };

export const latexToMatrix = (latexRaw: string): LatexToMatrixReturnType => {
  const latex = latexRaw.trim();
  if (!latex) return { ok: false, error: "Empty input." };
  if (/\s/.test(latex)) {
    // you said no whitespace in values; LaTeX will contain whitespace often
    // We'll allow whitespace in the overall string, but NOT inside the extracted cell values.
    // So we don't reject here; we will reject per-cell if whitespace remains.
  }

  // Extract content inside \begin{X} ... \end{X}
  const beginMatch = latex.match(/\\begin\{([a-zA-Z*]+)\}/);
  const endMatch = latex.match(/\\end\{([a-zA-Z*]+)\}/);

  if (!beginMatch || !endMatch) {
    return {
      ok: false,
      error: "Expected \\begin{matrix|bmatrix|pmatrix|...} ... \\end{...}.",
    };
  }

  const env = beginMatch[1];
  if (endMatch[1] !== env) {
    return {
      ok: false,
      error: `Mismatched environments: begin{${env}} but end{${endMatch[1]}}.`,
    };
  }

  const allowed = new Set([
    "matrix",
    "pmatrix",
    "bmatrix",
    "Bmatrix",
    "vmatrix",
    "Vmatrix",
  ]);
  if (!allowed.has(env)) {
    return {
      ok: false,
      error: `Unsupported environment "${env}". Use one of: ${Array.from(allowed).join(", ")}.`,
    };
  }

  // pull between begin/end
  const contentMatch = latex.match(
    new RegExp(
      String.raw`\\begin\{${env.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\}([\s\S]*?)\\end\{${env.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\}`,
    ),
  );
  if (!contentMatch)
    return { ok: false, error: "Could not extract matrix content." };

  let content = contentMatch[1];

  // Remove common LaTeX spacing commands
  content = content
    .replace(/\\left/g, "")
    .replace(/\\right/g, "")
    .replace(/\\,/g, "")
    .replace(/\\;/g, "")
    .replace(/\\!/g, "")
    .replace(/\\quad/g, "")
    .replace(/\\qquad/g, "");

  // Split rows by \\ (allow optional whitespace)
  const rowStrings = content
    .split(/\\\\/g)
    .map((r) => r.trim())
    .filter((r) => r.length > 0);

  if (rowStrings.length === 0) return { ok: false, error: "No rows found." };

  const rows: Matrix = [];
  let expectedCols: number | null = null;

  for (let r = 0; r < rowStrings.length; r++) {
    const rowStr = rowStrings[r];

    // Split columns by &
    const colStrings = rowStr.split("&").map((x) => x.trim());

    if (expectedCols === null) expectedCols = colStrings.length;
    if (colStrings.length !== expectedCols) {
      return {
        ok: false,
        error: `Jagged matrix: row ${r + 1} has ${colStrings.length} cols, expected ${expectedCols}.`,
      };
    }

    const row: MatrixCell[] = [];
    for (let c = 0; c < colStrings.length; c++) {
      let v = colStrings[c];

      // Convert \frac{a}{b} to a/b if present (basic support, no nested braces)
      // If you DON'T want this, delete this block.
      const frac = v.match(/^\\frac\{([^{}]+)\}\{([^{}]+)\}$/);
      if (frac) v = `${frac[1]}/${frac[2]}`;

      // Remove surrounding braces
      v = v.replace(/^\{/, "").replace(/\}$/, "");

      // Remove spaces (but reject if spaces appear inside tokens like "1 2")
      if (/\s/.test(v)) {
        return {
          ok: false,
          error: `Whitespace inside a cell at (${r + 1}, ${c + 1}) is not allowed: "${colStrings[c]}".`,
        };
      }

      // Validate allowed characters for a cell value (same as your editor)
      if (v === "")
        return { ok: false, error: `Empty cell at (${r + 1}, ${c + 1}).` };
      if (/[^0-9\-\/\.,]/.test(v)) {
        return {
          ok: false,
          error: `Invalid cell "${colStrings[c]}" at (${r + 1}, ${c + 1}). Allowed: digits, -, /, . ,`,
        };
      }
      if (
        (v.match(/-/g) ?? []).length > 1 ||
        (v.includes("-") && !v.startsWith("-"))
      ) {
        return {
          ok: false,
          error: `Invalid "-" placement at (${r + 1}, ${c + 1}): "${colStrings[c]}".`,
        };
      }
      if ((v.match(/\//g) ?? []).length > 1) {
        return {
          ok: false,
          error: `Only one "/" allowed at (${r + 1}, ${c + 1}): "${colStrings[c]}".`,
        };
      }

      row.push(makeCell(v));
    }

    rows.push(row);
  }

  return { ok: true, value: rows };
};
