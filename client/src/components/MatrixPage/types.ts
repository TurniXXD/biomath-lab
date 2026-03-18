import { Matrix } from "@/lib/api/types";
import { Fraction } from "mathjs";

export type SavedMatrix = {
  id: string;
  name: string;
  data: Matrix;
};

export type ViewItem = {
  id: string;
  sourceId: string;
  name: string;
  data: Matrix; // snapshot at time of drop
};

export type MatrixOperation = "+" | "×";
export type FractionMatrix = Fraction[][];
