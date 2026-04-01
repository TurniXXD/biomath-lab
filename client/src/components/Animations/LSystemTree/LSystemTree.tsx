"use client";

import Leaf from "@/components/Animations/LSystemTree/Leaf";
import { SliderRow } from "@/components/UI/Slider/Slider";
import {
  Box,
  Button,
  HStack,
  Switch,
  Text,
  VStack,
} from "@chakra-ui/react";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useCallback, useMemo, useState } from "react";
import { BlockMath, InlineMath } from "react-katex";
import { BufferGeometry, Vector3 } from "three";

type SymbolKey = "A" | "B" | "C" | "D" | "K";

const geometryToAsciiStl = (geometry: BufferGeometry) => {
  const position = geometry.getAttribute("position");
  const index = geometry.getIndex();

  if (!position || position.count < 3) {
    return null;
  }

  const triangleCount = index ? index.count / 3 : position.count / 3;
  const lines = ["solid lsystem_leaf"];
  const a = new Vector3();
  const b = new Vector3();
  const c = new Vector3();
  const ab = new Vector3();
  const ac = new Vector3();
  const normal = new Vector3();

  for (let triangle = 0; triangle < triangleCount; triangle += 1) {
    const ia = index ? index.getX(triangle * 3) : triangle * 3;
    const ib = index ? index.getX(triangle * 3 + 1) : triangle * 3 + 1;
    const ic = index ? index.getX(triangle * 3 + 2) : triangle * 3 + 2;

    a.set(position.getX(ia), position.getY(ia), position.getZ(ia));
    b.set(position.getX(ib), position.getY(ib), position.getZ(ib));
    c.set(position.getX(ic), position.getY(ic), position.getZ(ic));

    ab.subVectors(b, a);
    ac.subVectors(c, a);
    normal.crossVectors(ab, ac).normalize();

    lines.push(
      `facet normal ${normal.x} ${normal.y} ${normal.z}`,
      "  outer loop",
      `    vertex ${a.x} ${a.y} ${a.z}`,
      `    vertex ${b.x} ${b.y} ${b.z}`,
      `    vertex ${c.x} ${c.y} ${c.z}`,
      "  endloop",
      "endfacet",
    );
  }

  lines.push("endsolid lsystem_leaf");
  return lines.join("\n");
};

const LSystemTree = () => {
  const [steps, setSteps] = useState(10);
  const [hoveredStepIndex, setHoveredStepIndex] = useState<number | null>(null);
  const [hoveredCharIndex, setHoveredCharIndex] = useState<number | null>(null);
  const [visibleSymbols, setVisibleSymbols] = useState<Record<SymbolKey, boolean>>({
    A: false,
    B: false,
    C: false,
    D: false,
    K: false,
  });
  const [leafGeometry, setLeafGeometry] = useState<BufferGeometry | null>(null);
  let leaf = "A";
  const leafSteps: string[] = [leaf];

  for (let i = 0; i < steps; i++) {
    const currentLeafLetters = leaf.split("");
    const leafNextStep = [];

    for (let j = 0; j < currentLeafLetters.length; j++) {
      switch (currentLeafLetters[j]) {
        case "A":
          leafNextStep.push("CBC");
          break;
        case "B":
          leafNextStep.push("DAD");
          break;
        case "C":
          leafNextStep.push("K");
          break;
        case "D":
          leafNextStep.push("A");
          break;
        case "K":
          leafNextStep.push("K");
          break;
      }
    }

    leaf = leafNextStep.join("");

    leafSteps.push(leaf);
  }

  const displayStepIndex = hoveredStepIndex ?? steps;
  const leafHoverIndex = hoveredStepIndex === displayStepIndex ? hoveredCharIndex : null;
  const activeRecipe = leafSteps[displayStepIndex] ?? "";
  const defaultHighlightIndex = useMemo(() => {
    if (!activeRecipe) {
      return null;
    }

    return Math.floor(activeRecipe.length / 2);
  }, [activeRecipe]);

  const handleHoverEnd = () => {
    setHoveredStepIndex(null);
    setHoveredCharIndex(null);
  };

  const toggleSymbol = (symbol: SymbolKey) => {
    setVisibleSymbols((current) => ({
      ...current,
      [symbol]: !current[symbol],
    }));
  };

  const handleGeometryReady = useCallback((geometry: BufferGeometry | null) => {
    setLeafGeometry((current) => {
      current?.dispose();
      return geometry ? geometry.clone() : null;
    });
  }, []);

  const exportStl = () => {
    if (!leafGeometry) {
      return;
    }

    const stl = geometryToAsciiStl(leafGeometry);

    if (!stl) {
      return;
    }

    const blob = new Blob([stl], { type: "model/stl" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lsystem-leaf-step-${displayStepIndex}.stl`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <VStack align="stretch" spacing={0} w="100%" h="100vh">
      <Box
        bg="gray.900"
        color="white"
        borderBottomWidth="1px"
        borderBottomColor="whiteAlpha.200"
        px={4}
        py={3}
        maxH="42vh"
        overflowY="auto"
      >
        <Box maxW="360px">
          <SliderRow
            label="L-System steps"
            value={steps}
            min={1}
            max={15}
            step={1}
            onChange={setSteps}
          />
        </Box>
        <HStack align="start" spacing={6}>
          <Box minW="320px" maxW="420px">
            <Text pt={2} fontSize="xl">
              Lsystem
            </Text>
            <Box py={3} color="whiteAlpha.900">
              <Text fontSize="sm" mb={2}>
                Rewriting rule:{" "}
                <InlineMath
                  math={
                    "A \\to CBC,\\; B \\to DAD,\\; C \\to K,\\; D \\to A,\\; K \\to K"
                  }
                />
              </Text>
              <BlockMath
                math={String.raw`w_{0}=A,\qquad
                w_{n+1}=\varphi(w_n),\qquad
                \Gamma_n=\bigcup_{i} \gamma\!\left(\varphi_i\!\left((w_n)_i\right)\right)`}
              />
              <Text fontSize="xs" color="whiteAlpha.700">
                Each symbol selects a curve primitive, and the leaf boundary is
                the mirrored union of those primitives around the center vein.
              </Text>
            </Box>

            <HStack spacing={4} flexWrap="wrap" pb={3}>
              {(["A", "B", "C", "D", "K"] as SymbolKey[]).map((symbol) => {
                return (
                  <HStack key={symbol} spacing={2}>
                    <Text fontSize="sm">{symbol}</Text>
                    <Switch
                      size="sm"
                      isChecked={visibleSymbols[symbol]}
                      onChange={() => {
                        toggleSymbol(symbol);
                      }}
                    />
                  </HStack>
                );
              })}
            </HStack>

            <Button size="sm" colorScheme="green" onClick={exportStl}>
              Export STL
            </Button>
          </Box>

          <Box flex="1" minW="0">
            {leafSteps.map((stepLetters, i) => (
              <Box
                key={i}
                py={1}
                bg={displayStepIndex === i ? "whiteAlpha.100" : "transparent"}
                onMouseLeave={handleHoverEnd}
              >
                {i}:{" "}
                {stepLetters.split("").map((stepLetter, j) => (
                  <Box
                    as="span"
                    key={j}
                    display="inline-block"
                    px={1}
                    mx="1px"
                    borderRadius="sm"
                    cursor="pointer"
                    transition="background 0.15s ease, color 0.15s ease"
                    bg={
                      hoveredStepIndex === i && hoveredCharIndex === j
                        ? "yellow.300"
                        : displayStepIndex === i && defaultHighlightIndex === j
                          ? "red.500"
                          : "transparent"
                    }
                    color={
                      hoveredStepIndex === i && hoveredCharIndex === j
                        ? "black"
                        : "white"
                    }
                    onMouseEnter={() => {
                      setHoveredStepIndex(i);
                      setHoveredCharIndex(j);
                    }}
                  >
                    {stepLetter}
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        </HStack>
      </Box>

      <Box flex="1" minH="0">
        <Canvas
          camera={{ position: [0, 5, 15], fov: 50 }}
          style={{ height: "100%", width: "100%" }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <OrbitControls />
          <axesHelper args={[5]} />

          {/* <Plane length={steps * 2} /> */}
          <Leaf
            leafSteps={leafSteps}
            stepIndex={displayStepIndex}
            highlightedCharIndex={leafHoverIndex}
            visibleSymbols={visibleSymbols}
            onGeometryReady={handleGeometryReady}
          />
          {/* {nodes.slice(0, visibleCount).map((n) => {
            const isActive = activeNode?.id === n.id;
            return <BranchMesh key={n.id} node={n} isActive={isActive} />;
          })} */}
        </Canvas>
      </Box>
    </VStack>
  );
};

export default LSystemTree;
