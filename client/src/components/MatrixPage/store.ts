import { create } from "zustand";

import { SavedMatrix } from "@/components/MatrixPage/types";
import { ViewItem, MatrixOperation } from "@/components/MatrixPage/types";
import { insertViewportAt } from "@/components/MatrixPage/utils";
import { makeIdentityMatrix } from "@/components/Matrix/utils";
import { Matrix } from "@/lib/api/types";

export interface MatrixStoreState {
  editor: Matrix;
  library: SavedMatrix[];
  viewport: ViewItem[];
  operations: MatrixOperation[];

  setEditor: (editor: Matrix) => void;
  setLibrary: (library: SavedMatrix[]) => void;
  setViewport: (viewport: ViewItem[]) => void;
  setOperations: (ops: MatrixOperation[]) => void;

  dropProgrammatic: (positionIndex: number, item: ViewItem) => void;
}

export const useMatrixStore = create<MatrixStoreState>((set, get) => ({
  editor: makeIdentityMatrix(3),
  library: [],
  viewport: [],
  operations: [],

  setEditor: (editor) => {
    set({ editor });
  },

  setLibrary: (library) => {
    set({ library });
  },

  setViewport: (viewport) => {
    set({ viewport });
  },

  setOperations: (operations) => {
    set({ operations });
  },

  dropProgrammatic: (positionIndex: number, item: ViewItem) => {
    const viewport = get().viewport;
    const operations = get().operations;
    const nextViewport = insertViewportAt(viewport, positionIndex, item);

    let nextOperations: MatrixOperation[] = [];
    const newLen = viewport.length + 1;

    if (newLen > 1) {
      const rebuilt: MatrixOperation[] = Array.from(
        { length: newLen - 1 },
        () => "×",
      );

      for (let i = 0; i < operations.length; i++) {
        const newOpIndex = i >= positionIndex ? i + 1 : i;

        if (rebuilt[newOpIndex] !== undefined) {
          rebuilt[newOpIndex] = operations[i];
        }
      }

      nextOperations = rebuilt;
    }

    set({
      viewport: nextViewport,
      operations: nextOperations,
    });
  },
}));
