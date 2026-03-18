"use client";

import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import { Box, Button, Flex, Text } from "@chakra-ui/react";

import { makeMatrix } from "@/components/Matrix/EditableMatrix/utils";
import { Matrix } from "@/lib/api/types";

interface EditableMatrixProps {
  initialRows?: number;
  initialCols?: number;
  initialValue?: string;
  value?: Matrix;
  onChange?: (m: Matrix) => void;
  cellWidth?: number;
  maxCellChars?: number;
  arrowNavMode?: "always" | "onlyAtEdges";
}

const clamp = (n: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, n));
};

export const EditableMatrix = ({
  initialRows = 2,
  initialCols = 2,
  initialValue = "0",
  value,
  onChange,
  cellWidth = 80,
  maxCellChars = 16,
  arrowNavMode = "onlyAtEdges",
}: EditableMatrixProps) => {
  const [internal, setInternal] = useState<Matrix>(() => {
    return makeMatrix(initialRows, initialCols, initialValue);
  });

  useEffect(() => {
    if (value) {
      setInternal(value);
    }
  }, [value]);

  const matrix = value ?? internal;
  const rows = matrix.length;
  const cols = matrix[0]?.length ?? 0;

  const emit = useCallback(
    (next: Matrix) => {
      if (!value) {
        setInternal(next);
      }
      onChange?.(next);
    },
    [onChange, value],
  );

  const inputsRef = useRef<(HTMLInputElement | null)[][]>([]);

  useEffect(() => {
    inputsRef.current = Array.from({ length: rows }, (_, r) =>
      Array.from(
        { length: cols },
        (_, c) => inputsRef.current?.[r]?.[c] ?? null,
      ),
    );
  }, [rows, cols]);

  const focusCell = useCallback(
    (r: number, c: number) => {
      const rr = clamp(r, 0, rows - 1);
      const cc = clamp(c, 0, cols - 1);
      const el = inputsRef.current?.[rr]?.[cc];

      if (el) {
        el.focus();
        el.select();
      }
    },
    [rows, cols],
  );

  const setCell = useCallback(
    (r: number, c: number, raw: string) => {
      if (/\s/.test(raw)) {
        return;
      }

      if (raw.length > maxCellChars) {
        return;
      }

      if (/[^0-9\-\/\.,]/.test(raw)) {
        return;
      }

      if ((raw.match(/-/g) ?? []).length > 1) {
        return;
      }

      if (raw.includes("-") && !raw.startsWith("-")) {
        return;
      }

      if ((raw.match(/\//g) ?? []).length > 1) {
        return;
      }

      emit(
        matrix.map((row, ri) =>
          ri === r
            ? row.map((cell, ci) => (ci === c ? { ...cell, value: raw } : cell))
            : row,
        ),
      );
    },
    [matrix, emit, maxCellChars],
  );

  const addRow = useCallback(() => {
    emit([
      ...matrix,
      Array.from({ length: cols }, () => ({ value: initialValue })),
    ]);
  }, [matrix, cols, initialValue, emit]);

  const addCol = useCallback(() => {
    emit(matrix.map((row) => [...row, { value: initialValue }]));
  }, [matrix, initialValue, emit]);

  const removeRow = useCallback(
    (r: number) => {
      if (rows <= 1) {
        return;
      }

      const next = matrix.filter((_, ri) => ri !== r);
      emit(next);

      queueMicrotask(() => {
        focusCell(Math.min(r, rows - 2), 0);
      });
    },
    [matrix, rows, emit, focusCell],
  );

  const removeCol = useCallback(
    (c: number) => {
      if (cols <= 1) {
        return;
      }

      const next = matrix.map((row) => row.filter((_, ci) => ci !== c));
      emit(next);

      queueMicrotask(() => {
        focusCell(0, Math.min(c, cols - 2));
      });
    },
    [matrix, cols, emit, focusCell],
  );

  const shouldNavOnArrow = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (arrowNavMode === "always") {
      return true;
    }

    const el = e.currentTarget;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const len = el.value.length;

    const allSelected = start === 0 && end === len;
    if (allSelected) {
      return true;
    }

    switch (e.key) {
      case "ArrowLeft":
        return start === 0 && end === 0;
      case "ArrowRight":
        return start === len && end === len;
      case "ArrowUp":
      case "ArrowDown":
        return true;
      default:
        return true;
    }
  };

  const onKeyDownCell = useCallback(
    (r: number, c: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      const k = e.key;

      if (
        k === "ArrowLeft" ||
        k === "ArrowRight" ||
        k === "ArrowUp" ||
        k === "ArrowDown" ||
        k === "Enter"
      ) {
        if (k.startsWith("Arrow") && !shouldNavOnArrow(e)) {
          return;
        }

        e.preventDefault();

        if (k === "ArrowLeft") {
          focusCell(r, c - 1);
        }
        if (k === "ArrowRight") {
          focusCell(r, c + 1);
        }
        if (k === "ArrowUp") {
          focusCell(r - 1, c);
        }
        if (k === "ArrowDown") {
          focusCell(r + 1, c);
        }
        if (k === "Enter") {
          focusCell(r + 1, c);
        }
      }
    },
    [focusCell],
  );

  const gridTemplateColumns = useMemo(() => {
    return `36px repeat(${cols}, ${cellWidth}px)`;
  }, [cols, cellWidth]);

  return (
    <Box display="grid" gap={3} overflow="scroll">
      <Flex gap={2} wrap="wrap" align="center">
        <Button size="sm" variant="outline" onClick={addRow}>
          + Row
        </Button>
        <Button size="sm" variant="outline" onClick={addCol}>
          + Col
        </Button>
        <Text opacity={0.7}>
          {rows}×{cols}
        </Text>
      </Flex>

      {/* Column remove buttons row */}
      <Box
        display="grid"
        gridTemplateColumns={gridTemplateColumns}
        gap={2}
        alignItems="center"
      >
        <Box /> {/* top-left corner spacer */}
        {Array.from({ length: cols }).map((_, c) => (
          <Button
            key={`col-${c}`}
            size="sm"
            variant="outline"
            onClick={() => removeCol(c)}
            isDisabled={cols <= 1}
            title="Remove column"
            w={`${cellWidth}px`}
            fontWeight="700"
          >
            -
          </Button>
        ))}
      </Box>

      {/* Matrix rows with row remove button at beginning */}
      <Box display="grid" gap={2}>
        {matrix.map((row, r) => (
          <Box
            key={`row-${r}`}
            display="grid"
            gridTemplateColumns={gridTemplateColumns}
            gap={2}
            alignItems="center"
          >
            <Button
              size="sm"
              variant="outline"
              onClick={() => removeRow(r)}
              isDisabled={rows <= 1}
              title="Remove row"
              w="36px"
              fontWeight="700"
            >
              -
            </Button>

            {row.map((cell, c) => (
              <input
                key={`${r}-${c}`}
                ref={(el) => {
                  if (!inputsRef.current[r]) {
                    inputsRef.current[r] = [];
                  }
                  inputsRef.current[r][c] = el;
                }}
                value={cell.value}
                maxLength={maxCellChars}
                inputMode="decimal"
                autoComplete="off"
                spellCheck={false}
                onChange={(e) => setCell(r, c, e.target.value)}
                onKeyDown={(e) => onKeyDownCell(r, c, e)}
                style={{ ...inputStyle, width: cellWidth }}
                aria-label={`Cell ${r + 1}, ${c + 1}`}
              />
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const inputStyle: React.CSSProperties = {
  height: 36,
  padding: "6px 8px",
  borderRadius: 10,
  border: "1px solid #ccc",
  fontFamily:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
};
