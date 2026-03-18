import { Matrix } from "@/lib/api/types";

export const matrixToLatex = (m: Matrix, env: string = "bmatrix") => {
  const rows = m
    .map((row) =>
      row
        .map((cell) => {
          const v = cell.value.trim();

          // convert a/b into \frac{a}{b}
          if (v.includes("/")) {
            const [a, b] = v.split("/");
            return `\\frac{${a}}{${b}}`;
          }

          return v;
        })
        .join(" & "),
    )
    .join(" \\\\ ");

  return `\\begin{${env}} ${rows} \\end{${env}}`;
};
