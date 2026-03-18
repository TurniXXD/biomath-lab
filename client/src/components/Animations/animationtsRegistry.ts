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
