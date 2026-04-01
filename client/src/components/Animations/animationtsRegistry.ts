export const animationRegistry = {
  "brain-model": {
    src: () => import("@/components/Animations/BrainModel/BrainModel"),
    title: "Interactive Brain Model",
  },
  "fractal-tree": {
    src: () => import("@/components/Animations/FractalTree/FractalTree"),
    title: "Fractal Tree",
  },
  "3d-coordinate-system": {
    src: () => import("@/components/3DCoordinateSystem/3DCoordinateSystem"),
    title: "3D Coordinate System",
  },
  "gradient-descent": {
    src: () =>
      import("@/components/Animations/GradientDescent/GradientDescent"),
    title: "Gradient Descent",
  },
  "game-of-life": {
    src: () => import("@/components/Animations/GameOfLife/GameOfLife"),
    title: "Game of Life",
  },
  "mandelbrot-set": {
    src: () => import("@/components/Animations/MandelbrotSet/MandelbrotSet"),
    title: "Mandelbrot Set",
  },
  "menger-sponge": {
    src: () => import("@/components/Animations/MengerSponge/MengerSponge"),
    title: "Menger Sponge",
  },
  "needleman-wunsch": {
    src: () =>
      import(
        "@/components/Animations/NeedlemanWunschAlignment/NeedlemanWunschAlignment"
      ),
    title: "Needleman-Wunsch / Smith-Waterman",
  },
  "golden-ratio": {
    src: () => import("@/components/Animations/GoldenRatio/GoldenRatio"),
    title: "Golden Ratio",
  },
  "sierpinski-triangle-zoom": {
    src: () =>
      import(
        "@/components/Animations/SierpinskiTriangleZoom/SierpinskiTriangleZoom"
      ),
    title: "Sierpinski Triangle Zoom",
  },
  "cup-to-toroid-morph": {
    src: () =>
      import(
        "@/components/Animations/CupToToroidMorph/CupToToroidMorph"
      ),
    title: "Cup to Toroid Morph",
  },
  "cone-pine": {
    src: () => import("@/components/Animations/ConePine/ConePine"),
    title: "Cone Pine",
  },
  "hyperbolic-paraboloid": {
    src: () =>
      import(
        "@/components/Animations/HyperbolicParaboloid/HyperbolicParaboloid"
      ),
    title: "Hyperbolic Paraboloid",
  },
  "space-curvature": {
    src: () => import("@/components/Animations/SpaceCurvature/SpaceCurvature"),
    title: "Space Curvature",
  },
  "3-body-problem": {
    src: () => import("@/components/Animations/3BodyProblem/3BodyProblem"),
    title: "3-Body Problem",
  },
  "3d-plane-rotation": {
    src: () =>
      import("@/components/Animations/3DPlaneRotation/3DPlaneRotation"),
    title: "3D Plane Rotation",
  },
  "methane-vdw": {
    src: () => import("@/components/Animations/Methane/Methane"),
    title: "Methane VDW",
  },
  "hyperbolic-tree": {
    src: () => import("@/components/Animations/HyperbolicTree/HyperbolicTree"),
    title: "Hyperbolic Tree",
  },
  "penrose-triangle-3d": {
    src: () =>
      import("@/components/Animations/PenroseTriangle3D/PenroseTriangle3D"),
    title: "Penrose Triangle 3D",
  },
  "solar-system-3d": {
    src: () =>
      import("@/components/Animations/SolarSystem3D/SolarSystem3D"),
    title: "Solar System 3D",
  },
  "hilbert-curve-3d": {
    src: () =>
      import("@/components/Animations/HilbertCurve3D/HilbertCurve3D"),
    title: "Hilbert Curve 3D",
  },
  "spherical-cell-layers": {
    src: () =>
      import("@/components/Animations/SphericalCellLayers/SphericalCellLayers"),
    title: "Spherical Cell Layers",
  },
  "elliptic-paraboloid-stack": {
    src: () =>
      import("@/components/Animations/EllipticParaboloidStack/EllipticParaboloidStack"),
    title: "Elliptic paraboloid stack",
  },
  "elliptic-paraboloid-tree": {
    src: () =>
      import("@/components/Animations/EllipticParaboloidTree/EllipticParaboloidTree"),
    title: "Elliptic paraboloid tree",
  },
  "succulent": {
    src: () => import("@/components/Animations/Succulent/Succulent"),
    title: "Succulent",
  },
  "l-system-tree": {
    src: () => import("@/components/Animations/LSystemTree/LSystemTree"),
    title: "L-system tree",
  },
} as const;

export type AnimationId = keyof typeof animationRegistry;

export const animationList = Object.entries(animationRegistry).map(
  ([id, meta]) => {
    return {
      id: id as AnimationId,
      title: meta.title,
      href: `/animations/${id}`,
    };
  },
);
