import { useEffect, useMemo } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  ExtrudeGeometry,
  QuadraticBezierCurve,
  Shape,
  TubeGeometry,
  Vector2,
  Vector3,
} from "three";
import { Line } from "@react-three/drei";

interface LeafProps {
  leafSteps: string[];
  stepIndex?: number;
  highlightedCharIndex?: number | null;
  visibleSymbols?: Partial<Record<"A" | "B" | "C" | "D" | "K", boolean>>;
  onGeometryReady?: (geometry: BufferGeometry | null) => void;
}

type SegmentResult = {
  points: Vector2[];
  endVector: Vector2;
};

type AxisMode = "vertical" | "horizontal-out" | "horizontal-in";

type DebugSegment = {
  symbol: string;
  points: Vector2[];
  recipeIndices: number[];
};

type VeinBranch = {
  points: [number, number, number][];
};

const CURVE_SAMPLES = 20;
const MIN_SEGMENTS_BEFORE_TAIL_TRIM = 3;
const TAIL_CENTERLINE_THRESHOLD = 0.45;
const TAIL_NECK_THRESHOLD = 0.7;
const TAIL_REEXPAND_DELTA = 0.2;
const CONTOUR_TAIL_TRIM_THRESHOLD = 0.38;
const CONTOUR_TAIL_TRIM_PROGRESS = 0.62;
const MAX_LEAF_CURL = 1.2;
const SURFACE_OFFSET = 0.012;
const LEAF_THICKNESS = 0.1;
const CENTER_VEIN_RADIUS = 0.04;
const BRANCH_VEIN_RADIUS = 0.022;
const VEIN_SURFACE_LIFT = 0.035;

const createCurvedTopShape = () => {
  const top = new Vector2(0, 0);
  const leftBase = new Vector2(-0.6, -0.8);
  const rightBase = new Vector2(0.6, -0.8);

  const leftControl = new Vector2(-0.15, -0.45);
  const rightControl = new Vector2(0.15, -0.45);

  const leftCurve = new QuadraticBezierCurve(top, leftControl, leftBase);
  const rightCurve = new QuadraticBezierCurve(rightBase, rightControl, top);

  return {
    top,
    leftPoints: leftCurve.getPoints(CURVE_SAMPLES),
    rightPoints: rightCurve.getPoints(CURVE_SAMPLES),
    leftEndVector: leftBase,
    rightEndVector: rightBase,
  };
};

const createVerticalTopShapeFromEnd = (
  startingTopVector: Vector2,
): SegmentResult => {
  const midVector = startingTopVector.clone().add(new Vector2(-0.6, -0.8));
  const midControl = startingTopVector.clone().add(new Vector2(-0.15, -0.45));

  const firstCurve = new QuadraticBezierCurve(
    startingTopVector,
    midControl,
    midVector,
  );

  const endVector = midVector.clone().add(new Vector2(0.6, -0.8));
  const endControl = midVector.clone().add(new Vector2(0.6, -0.45));

  const secondCurve = new QuadraticBezierCurve(
    midVector,
    endControl,
    endVector,
  );

  const firstPoints = firstCurve.getPoints(CURVE_SAMPLES);
  const secondPoints = secondCurve.getPoints(CURVE_SAMPLES);

  return {
    points: [...firstPoints, ...secondPoints.slice(1)],
    endVector,
  };
};

const createCurvedLineShape = (
  startingVector: Vector2,
  axisMode: AxisMode,
): SegmentResult => {
  let endVector: Vector2;
  let control: Vector2;

  switch (axisMode) {
    case "vertical":
      endVector = startingVector.clone().add(new Vector2(-0.2, -1));
      control = startingVector.clone().add(new Vector2(-0.05, -0.45));
      break;

    case "horizontal-out":
      /**
       * Move further left, away from center.
       */
      endVector = startingVector.clone().add(new Vector2(-1, -0.2));
      control = startingVector.clone().add(new Vector2(-0.45, -0.2));
      break;

    case "horizontal-in":
      /**
       * Move right, back toward center.
       */
      endVector = startingVector.clone().add(new Vector2(1, -0.2));
      control = startingVector.clone().add(new Vector2(0.45, 0));
      break;
  }

  const curve = new QuadraticBezierCurve(startingVector, control, endVector);

  return {
    points: curve.getPoints(CURVE_SAMPLES),
    endVector,
  };
};

const createCurvedCornerShape = (
  startingVector: Vector2,
  axisMode: AxisMode,
): SegmentResult => {
  let endVector: Vector2;
  let control: Vector2;

  switch (axisMode) {
    case "vertical":
      /**
       * Vertical -> horizontal-out corner
       */
      endVector = startingVector.clone().add(new Vector2(-0.75, -0.75));
      control = startingVector.clone().add(new Vector2(-0.1, -0.45));
      break;

    case "horizontal-out":
      /**
       * Horizontal-out -> vertical corner
       */
      endVector = startingVector.clone().add(new Vector2(-0.75, -0.75));
      control = startingVector.clone().add(new Vector2(-0.45, -0.1));
      break;

    case "horizontal-in":
      /**
       * Horizontal-in -> vertical corner
       * Mirror the horizontal-out turn shape.
       */
      endVector = startingVector.clone().add(new Vector2(0.75, -0.75));
      control = startingVector.clone().add(new Vector2(0.45, -0.1));
      break;
  }

  const curve = new QuadraticBezierCurve(startingVector, control, endVector);

  return {
    points: curve.getPoints(CURVE_SAMPLES),
    endVector,
  };
};

const createLeafBaseClosure = (startingVector: Vector2): SegmentResult => {
  const endVector = new Vector2(
    0,
    startingVector.y - Math.max(0.35, Math.abs(startingVector.x) * 0.6),
  );
  const control = new Vector2(startingVector.x * 0.35, startingVector.y - 0.15);

  const curve = new QuadraticBezierCurve(startingVector, control, endVector);

  return {
    points: curve.getPoints(CURVE_SAMPLES),
    endVector,
  };
};

const getLetterColor = (symbol: string) => {
  switch (symbol) {
    case "A":
      return "#ff4d4f";
    case "B":
      return "#fa8c16";
    case "C":
      return "#52c41a";
    case "D":
      return "#1677ff";
    case "K":
      return "#b37feb";
    default:
      return "#ffffff";
  }
};

const shouldTrimTail = ({
  processedSegments,
  currentLeft,
  nextEndVector,
}: {
  processedSegments: number;
  currentLeft: Vector2;
  nextEndVector: Vector2;
}) => {
  if (processedSegments < MIN_SEGMENTS_BEFORE_TAIL_TRIM) {
    return false;
  }

  const nextAbsX = Math.abs(nextEndVector.x);

  if (nextAbsX < TAIL_CENTERLINE_THRESHOLD) {
    return true;
  }

  const currentAbsX = Math.abs(currentLeft.x);
  const isInNeck = currentAbsX < TAIL_NECK_THRESHOLD;
  const isReExpanding = nextAbsX > currentAbsX + TAIL_REEXPAND_DELTA;

  return isInNeck && isReExpanding;
};

const trimContourTail = (points: Vector2[]) => {
  if (points.length < 8) {
    return { points, cutoffY: Number.NEGATIVE_INFINITY };
  }

  const startIndex = Math.floor(points.length * CONTOUR_TAIL_TRIM_PROGRESS);
  const trimIndex = points.findIndex((point, index) => {
    return (
      index >= startIndex && Math.abs(point.x) < CONTOUR_TAIL_TRIM_THRESHOLD
    );
  });

  if (trimIndex === -1) {
    return { points, cutoffY: Number.NEGATIVE_INFINITY };
  }

  return {
    points: points.slice(0, trimIndex + 1),
    cutoffY: points[trimIndex]?.y ?? Number.NEGATIVE_INFINITY,
  };
};

const computeLeafDepth = (point: Vector2, maxAbsX: number, minY: number) => {
  if (maxAbsX <= 0) {
    return 0;
  }

  const edgeFactor = Math.min(1, Math.abs(point.x) / maxAbsX);
  const verticalFactor = Math.max(0.15, 1 - Math.abs(point.y - minY) * 0.035);

  return edgeFactor * edgeFactor * verticalFactor * MAX_LEAF_CURL;
};

const curveLeafGeometry = (flatGeometry: ExtrudeGeometry) => {
  const geometry = flatGeometry.clone();
  const position = geometry.getAttribute("position");

  let maxAbsX = 0;
  let minY = Number.POSITIVE_INFINITY;

  for (let index = 0; index < position.count; index += 1) {
    maxAbsX = Math.max(maxAbsX, Math.abs(position.getX(index)));
    minY = Math.min(minY, position.getY(index));
  }

  const curvedPositions = new Float32Array(position.count * 3);
  const colors = new Float32Array(position.count * 3);
  const baseColor = new Color("#118a22");
  const ridgeColor = new Color("#7ed957");
  const shadowColor = new Color("#0c5f19");
  const sideColor = new Color("#0a4e15");

  for (let index = 0; index < position.count; index += 1) {
    const point = new Vector2(position.getX(index), position.getY(index));
    const offset = index * 3;
    const depth = computeLeafDepth(point, maxAbsX, minY);
    const originalZ = position.getZ(index);
    const edgeFactor =
      maxAbsX > 0 ? Math.min(1, Math.abs(point.x) / maxAbsX) : 0;
    const verticalFactor = Math.max(
      0,
      Math.min(1, 1 - Math.abs(point.y - minY) * 0.03),
    );
    const centerHighlight = 1 - edgeFactor;
    const thicknessScale = 0.22 + 0.78 * Math.pow(centerHighlight, 1.6);
    const localThickness = LEAF_THICKNESS * thicknessScale;
    const thicknessOffset = (originalZ / LEAF_THICKNESS - 0.5) * localThickness;

    curvedPositions[offset] = point.x;
    curvedPositions[offset + 1] = point.y;
    curvedPositions[offset + 2] = depth + thicknessOffset;

    const tinted = baseColor
      .clone()
      .lerp(ridgeColor, 0.28 * centerHighlight + 0.12 * verticalFactor)
      .lerp(
        shadowColor,
        0.18 * edgeFactor + 0.08 * Math.max(0, depth / MAX_LEAF_CURL),
      );

    const isSideFace =
      originalZ > 0.0001 && originalZ < LEAF_THICKNESS - 0.0001;
    const finalColor = isSideFace ? tinted.lerp(sideColor, 0.35) : tinted;

    colors[offset] = finalColor.r;
    colors[offset + 1] = finalColor.g;
    colors[offset + 2] = finalColor.b;
  }

  geometry.setAttribute("position", new BufferAttribute(curvedPositions, 3));
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  return {
    geometry,
    maxAbsX,
    minY,
  };
};

const makeVeinCurvePoints = (
  start: Vector2,
  end: Vector2,
  maxAbsX: number,
  minY: number,
) => {
  const midX = start.x + (end.x - start.x) * 0.42;
  const midY = start.y + (end.y - start.y) * 0.58;

  const controlPoints = [
    new Vector2(start.x, start.y),
    new Vector2(midX, midY + 0.18),
    new Vector2(end.x, end.y),
  ];

  const curve = new CatmullRomCurve3(
    controlPoints.map((point) => {
      return new Vector3(
        point.x,
        point.y,
        computeLeafDepth(point, maxAbsX, minY) + VEIN_SURFACE_LIFT,
      );
    }),
    false,
    "catmullrom",
    0.5,
  );

  return curve.getPoints(24).map((point) => {
    return [point.x, point.y, point.z] as [number, number, number];
  });
};

const Leaf = ({
  leafSteps,
  stepIndex = 0,
  highlightedCharIndex = null,
  visibleSymbols = {},
  onGeometryReady,
}: LeafProps) => {
  const { geometry, debugSegments, maxAbsX, minY } = useMemo(() => {
    if (leafSteps.length === 0) {
      return {
        geometry: new BufferGeometry(),
        debugSegments: [] as DebugSegment[],
        maxAbsX: 0,
        minY: 0,
      };
    }

    const safeStepIndex = Math.max(
      0,
      Math.min(stepIndex, leafSteps.length - 1),
    );
    const recipe = leafSteps[safeStepIndex].split("");

    const middleIndex = (recipe.length - 1) / 2;

    const { leftPoints: initialLeftTopPoints, leftEndVector } =
      createCurvedTopShape();

    const leftMainContour: Vector2[] = [...initialLeftTopPoints];

    const segments: DebugSegment[] = [
      {
        symbol: recipe[middleIndex] ?? "TOP",
        points: initialLeftTopPoints,
        recipeIndices: [middleIndex],
      },
    ];

    let currentLeft = leftEndVector.clone();
    let processedSegments = 0;

    /**
     * Start by descending.
     */
    let axisMode: AxisMode = "vertical";

    for (let i = middleIndex - 1; i >= 0; i--) {
      const symbol = recipe[i];
      let result: SegmentResult;

      if (symbol === "K") {
        result = createCurvedCornerShape(currentLeft, axisMode);

        /**
         * Flip direction mode after each corner.
         */
        if (axisMode === "vertical") {
          axisMode = "horizontal-out";
        } else {
          axisMode = "vertical";
        }

        if (
          shouldTrimTail({
            processedSegments,
            currentLeft,
            nextEndVector: result.endVector,
          })
        ) {
          break;
        }

        leftMainContour.push(...result.points.slice(1));
        currentLeft = result.endVector;

        segments.push({
          symbol,
          points: result.points,
          recipeIndices: [i, recipe.length - 1 - i],
        });
        processedSegments += 1;

        continue;
      }

      if (symbol === "A" || symbol === "B") {
        result = createVerticalTopShapeFromEnd(currentLeft);
        if (
          shouldTrimTail({
            processedSegments,
            currentLeft,
            nextEndVector: result.endVector,
          })
        ) {
          break;
        }

        leftMainContour.push(...result.points.slice(1));
        currentLeft = result.endVector;

        /**
         * After vertical top, continue horizontally back toward center.
         */
        axisMode = "horizontal-in";

        segments.push({
          symbol,
          points: result.points,
          recipeIndices: [i, recipe.length - 1 - i],
        });
        processedSegments += 1;

        continue;
      }

      result = createCurvedLineShape(currentLeft, axisMode);
      if (
        shouldTrimTail({
          processedSegments,
          currentLeft,
          nextEndVector: result.endVector,
        })
      ) {
        break;
      }

      leftMainContour.push(...result.points.slice(1));
      currentLeft = result.endVector;

      segments.push({
        symbol,
        points: result.points,
        recipeIndices: [i, recipe.length - 1 - i],
      });
      processedSegments += 1;
    }

    const trimmedContour = trimContourTail(leftMainContour);
    const trimmedLeftContour = trimmedContour.points;

    const trimmedEndPoint =
      trimmedLeftContour[trimmedLeftContour.length - 1] ?? currentLeft;

    if (Math.abs(trimmedEndPoint.x) > 0.001) {
      const closure = createLeafBaseClosure(trimmedEndPoint);
      trimmedLeftContour.push(...closure.points.slice(1));

      segments.push({
        symbol: "BASE",
        points: closure.points,
        recipeIndices: [],
      });
    }

    const visibleSegments = segments.filter((segment) => {
      if (trimmedContour.cutoffY === Number.NEGATIVE_INFINITY) {
        return true;
      }

      return segment.points.some((point) => point.y >= trimmedContour.cutoffY);
    });

    const rightBody = [...trimmedLeftContour]
      .slice(0, -1)
      .reverse()
      .map((point) => new Vector2(-point.x, point.y));

    const outline = [...trimmedLeftContour, ...rightBody];

    const shape = new Shape(outline);

    const flatGeometry = new ExtrudeGeometry(shape, {
      depth: LEAF_THICKNESS,
      bevelEnabled: false,
      steps: 1,
      curveSegments: CURVE_SAMPLES,
    });
    const curvedGeometry = curveLeafGeometry(flatGeometry);

    return {
      geometry: curvedGeometry.geometry,
      debugSegments: visibleSegments,
      maxAbsX: curvedGeometry.maxAbsX,
      minY: curvedGeometry.minY,
    };
  }, [leafSteps, stepIndex]);

  useEffect(() => {
    if (!onGeometryReady) {
      return;
    }

    onGeometryReady(geometry);

    return () => {
      onGeometryReady(null);
    };
  }, [geometry, onGeometryReady]);

  const centerLinePoints = useMemo<[number, number, number][]>(() => {
    const position = geometry.attributes.position;
    let topY = Number.NEGATIVE_INFINITY;
    let bottomY = Number.POSITIVE_INFINITY;

    for (let i = 0; i < position.count; i++) {
      topY = Math.max(topY, position.getY(i));
      bottomY = Math.min(bottomY, position.getY(i));
    }

    const controlPoints = [
      [0, topY, SURFACE_OFFSET],
      [0.08, (topY + bottomY) * 0.55, VEIN_SURFACE_LIFT + 0.03],
      [0.03, (topY + bottomY) * 0.2, VEIN_SURFACE_LIFT + 0.015],
      [0, bottomY, VEIN_SURFACE_LIFT],
    ] as [number, number, number][];

    const curve = new CatmullRomCurve3(
      controlPoints.map((point) => {
        return new Vector3(point[0], point[1], point[2]);
      }),
      false,
      "catmullrom",
      0.5,
    );

    return curve.getPoints(40).map((point) => {
      return [point.x, point.y, point.z] as [number, number, number];
    });
  }, [geometry]);

  const centerVeinGeometry = useMemo(() => {
    const curve = new CatmullRomCurve3(
      centerLinePoints.map((point) => {
        return new Vector3(point[0], point[1], point[2]);
      }),
      false,
      "catmullrom",
      0.5,
    );

    return new TubeGeometry(curve, 64, CENTER_VEIN_RADIUS, 10, false);
  }, [centerLinePoints]);

  const branchVeins = useMemo<VeinBranch[]>(() => {
    const veins: VeinBranch[] = [];

    debugSegments.forEach((segment) => {
      if (segment.symbol !== "A" && segment.symbol !== "B") {
        return;
      }

      const midpoint = segment.points[Math.floor(segment.points.length / 2)];

      if (!midpoint) {
        return;
      }

      const leftAnchor = new Vector2(-0.14, midpoint.y + 0.08);
      const rightAnchor = new Vector2(0.14, midpoint.y + 0.08);

      veins.push({
        points: makeVeinCurvePoints(leftAnchor, midpoint, maxAbsX, minY),
      });

      const mirroredMidpoint = new Vector2(-midpoint.x, midpoint.y);
      veins.push({
        points: makeVeinCurvePoints(
          rightAnchor,
          mirroredMidpoint,
          maxAbsX,
          minY,
        ),
      });
    });

    return veins;
  }, [debugSegments, maxAbsX, minY]);

  const branchVeinGeometries = useMemo(() => {
    return branchVeins.map((vein) => {
      const curve = new CatmullRomCurve3(
        vein.points.map((point) => {
          return new Vector3(point[0], point[1], point[2]);
        }),
        false,
        "catmullrom",
        0.5,
      );

      return new TubeGeometry(curve, 32, BRANCH_VEIN_RADIUS, 8, false);
    });
  }, [branchVeins]);

  return (
    <group position={[0, 0, 0]}>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          vertexColors
          side={DoubleSide}
          roughness={0.72}
          metalness={0.02}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      <mesh geometry={centerVeinGeometry} renderOrder={10}>
        <meshStandardMaterial
          color="#d7f3a8"
          emissive="#8fbf57"
          emissiveIntensity={0.35}
          roughness={0.58}
          metalness={0.02}
          depthTest={false}
        />
      </mesh>
      {branchVeinGeometries.map((veinGeometry, index) => {
        return (
          <mesh key={`vein-${index}`} geometry={veinGeometry} renderOrder={9}>
            <meshStandardMaterial
              color="#c7eb96"
              emissive="#7eae4e"
              emissiveIntensity={0.28}
              roughness={0.62}
              metalness={0.01}
              depthTest={false}
            />
          </mesh>
        );
      })}

      {debugSegments.map((segment, index) => {
        const leftPoints = segment.points.map(
          (point) =>
            [
              point.x,
              point.y,
              computeLeafDepth(point, maxAbsX, minY) + SURFACE_OFFSET,
            ] as [number, number, number],
        );

        const mirroredPoints = segment.points.map((point) => {
          const mirroredPoint = new Vector2(-point.x, point.y);

          return [
            mirroredPoint.x,
            mirroredPoint.y,
            computeLeafDepth(mirroredPoint, maxAbsX, minY) + SURFACE_OFFSET,
          ] as [number, number, number];
        });

        const color = getLetterColor(segment.symbol);
        const isHighlighted =
          highlightedCharIndex !== null &&
          segment.recipeIndices.includes(highlightedCharIndex);
        const isVisibleByToggle =
          segment.symbol === "A" ||
          segment.symbol === "B" ||
          segment.symbol === "C" ||
          segment.symbol === "D" ||
          segment.symbol === "K"
            ? Boolean(visibleSymbols[segment.symbol])
            : false;

        if (!isHighlighted && !isVisibleByToggle) {
          return null;
        }

        const activeColor = isHighlighted ? "#fff36b" : color;
        const activeWidth = isHighlighted ? 4 : 1.5;

        return (
          <group key={`${segment.symbol}-${index}`}>
            <Line
              points={leftPoints}
              color={activeColor}
              lineWidth={activeWidth}
              depthTest={false}
            />
            <Line
              points={mirroredPoints}
              color={activeColor}
              lineWidth={activeWidth}
              depthTest={false}
            />
          </group>
        );
      })}
    </group>
  );
};

export default Leaf;
