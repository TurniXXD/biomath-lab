import type { AnimationId } from "@/components/Animations/animationtsRegistry";

export type AnimationSectionId =
  | "algorithms"
  | "fractals"
  | "cs"
  | "chemistry"
  | "biology"
  | "physics"
  | "other";

export type AnimationSection = {
  id: AnimationSectionId;
  title: string;
  description: string;
};

export const animationSections: AnimationSection[] = [
  {
    id: "algorithms",
    title: "Algorithms",
    description: "Numerical methods, optimization, and dynamic programming.",
  },
  {
    id: "fractals",
    title: "Fractals",
    description: "Self-similar recursive structures and zoomable geometry.",
  },
  {
    id: "cs",
    title: "CS",
    description: "Classic computer science visualizations and automata.",
  },
  {
    id: "chemistry",
    title: "Chemistry",
    description: "Molecular geometry and intermolecular forces.",
  },
  {
    id: "biology",
    title: "Biology",
    description: "Brain and cell-scale systems.",
  },
  {
    id: "physics",
    title: "Physics",
    description: "Motion, fields, and spatial intuition.",
  },
  {
    id: "other",
    title: "Other",
    description: "Mathematical and geometric scenes that do not fit elsewhere.",
  },
];

export const animationSectionMap = {
  "brain-model": "biology",
  "cone-pine": "biology",
  "fractal-tree": "fractals",
  "3d-coordinate-system": "other",
  "gradient-descent": "algorithms",
  "game-of-life": "cs",
  "mandelbrot-set": "fractals",
  "menger-sponge": "fractals",
  "needleman-wunsch": "algorithms",
  "golden-ratio": "other",
  "sierpinski-triangle-zoom": "fractals",
  "cup-to-toroid-morph": "other",
  "hyperbolic-paraboloid": "other",
  "space-curvature": "physics",
  "3-body-problem": "physics",
  "3d-plane-rotation": "physics",
  "methane-vdw": "chemistry",
  "hyperbolic-tree": "fractals",
  "penrose-triangle-3d": "other",
  "solar-system-3d": "physics",
  "hilbert-curve-3d": "cs",
  "spherical-cell-layers": "biology",
  "elliptic-paraboloid-stack": "other",
  "elliptic-paraboloid-tree": "other",
  "succulent": "biology",
  "l-system-tree": "fractals",
} as const satisfies Record<AnimationId, AnimationSectionId>;

export const animationSectionAnchors = animationSections.map((section) => {
  return {
    id: section.id,
    title: section.title,
    href: `/animations#${section.id}`,
  };
});
