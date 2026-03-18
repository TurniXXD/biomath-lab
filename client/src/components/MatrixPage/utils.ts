import { SavedMatrix, ViewItem } from "@/components/MatrixPage/types";

export const insertViewportAt = (
  viewport: ViewItem[],
  positionIndex: number,
  item: ViewItem,
) => {
  const next = viewport.slice();
  next.splice(positionIndex, 0, item);
  return next;
};

export const getNextAutoName = (library: SavedMatrix[]) => {
  const base = "A";
  const names = new Set(library.map((x) => x.name));

  if (!names.has(base)) {
    return base;
  }

  let i = 1;

  const toSubscript = (n: number) => {
    const map: Record<string, string> = {
      "0": "₀",
      "1": "₁",
      "2": "₂",
      "3": "₃",
      "4": "₄",
      "5": "₅",
      "6": "₆",
      "7": "₇",
      "8": "₈",
      "9": "₉",
    };

    return String(n)
      .split("")
      .map((d) => map[d] ?? d)
      .join("");
  };

  while (true) {
    const candidate = `${base}${toSubscript(i)}`;

    if (!names.has(candidate)) {
      return candidate;
    }

    i += 1;
  }
};
