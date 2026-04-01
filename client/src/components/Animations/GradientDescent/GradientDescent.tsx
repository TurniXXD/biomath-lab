"use client";

import React, { useEffect, useMemo, useState } from "react";
import { BlockMath, InlineMath } from "react-katex";
import {
  Box,
  Button,
  HStack,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Text,
  VStack,
} from "@chakra-ui/react";
import AlgorithmDialogButton, {
  darkSecondaryButtonProps,
} from "@/components/Animations/AlgorithmDialogButton";

type Params = {
  lr: number;
  x0: number;
  stepMs: number;
};

const clamp = (v: number, min: number, max: number) => {
  if (v < min) {
    return min;
  }
  if (v > max) {
    return max;
  }
  return v;
};

// Example function: f(x) = x^4 - 3x^2 + 2
const f = (x: number) => {
  return x * x * x * x - 3 * x * x + 2;
};

// Derivative: f'(x) = 4x^3 - 6x
const df = (x: number) => {
  return 4 * x * x * x - 6 * x;
};

const GRADIENT_DESCENT_ALGO = {
  title: "Gradient descent update",
  summary:
    "The animation evaluates a one-dimensional function and repeatedly updates x by moving opposite the gradient. The path ends near a local minimum, or keeps moving if the learning rate is too large.",
  steps: [
    "Start from an initial x value.",
    "Compute the current function value and derivative.",
    "Apply x_{t+1} = x_t - η · f'(x_t).",
    "Clamp the result to the visible domain and append it to the history.",
    "Repeat on a timer to animate the optimization trace.",
  ],
  code: `const next = clamp(x - lr * df(x), domain.minX, domain.maxX);
setX(next);
setHistory((history) => [...history, { x: next, y: f(next) }]);`,
  note:
    "The plotted curve is f(x) = x^4 - 3x^2 + 2, so the trace makes the derivative-driven movement easy to see.",
};

const GradientDescentFormula = () => {
  const inline = String.raw`x_{t+1} = x_t - \eta \nabla f(x_t)`;
  const block = String.raw`
x_{t+1} = x_t - \eta \nabla f(x_t)
`;

  return (
    <Box>
      <Text>
        Update rule: <InlineMath math={inline} />
      </Text>

      <Box mt={3}>
        <BlockMath math={block} />
      </Box>
    </Box>
  );
};

const GradientDescent = () => {
  const [running, setRunning] = useState(false);

  const [lr, setLr] = useState(0.05);
  const [stepMs, setStepMs] = useState(250);

  const [x, setX] = useState(-1.6);
  const [step, setStep] = useState(0);

  const [history, setHistory] = useState<Array<{ x: number; y: number }>>(
    () => {
      const y0 = f(-1.6);
      return [{ x: -1.6, y: y0 }];
    },
  );

  const y = f(x);
  const grad = df(x);
  const xNext = x - lr * grad;

  // Plot domain / sampling
  const domain = useMemo(() => {
    return { minX: -2.5, maxX: 2.5 };
  }, []);

  const samples = useMemo(() => {
    const n = 300;
    const pts: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < n; i += 1) {
      const t = i / (n - 1);
      const xx = domain.minX + t * (domain.maxX - domain.minX);
      pts.push({ x: xx, y: f(xx) });
    }
    return pts;
  }, [domain.maxX, domain.minX]);

  const rangeY = useMemo(() => {
    let minY = Infinity;
    let maxY = -Infinity;

    for (const p of samples) {
      if (p.y < minY) {
        minY = p.y;
      }
      if (p.y > maxY) {
        maxY = p.y;
      }
    }

    // padding
    const pad = (maxY - minY) * 0.12;
    return { minY: minY - pad, maxY: maxY + pad };
  }, [samples]);

  // Mapping to SVG coords
  const W = 900;
  const H = 520;
  const margin = 36;

  const sx = (xx: number) => {
    const t = (xx - domain.minX) / (domain.maxX - domain.minX);
    return margin + t * (W - 2 * margin);
  };

  const sy = (yy: number) => {
    const t = (yy - rangeY.minY) / (rangeY.maxY - rangeY.minY);
    // invert Y for SVG
    return H - margin - t * (H - 2 * margin);
  };

  const curvePath = useMemo(() => {
    return samples
      .map((p, i) => {
        const cmd = i === 0 ? "M" : "L";
        return `${cmd} ${sx(p.x).toFixed(2)} ${sy(p.y).toFixed(2)}`;
      })
      .join(" ");
  }, [samples, rangeY.minY, rangeY.maxY]);

  const tracePath = useMemo(() => {
    return history
      .map((p, i) => {
        const cmd = i === 0 ? "M" : "L";
        return `${cmd} ${sx(p.x).toFixed(2)} ${sy(p.y).toFixed(2)}`;
      })
      .join(" ");
  }, [history]);

  const stepOnce = () => {
    const next = clamp(xNext, domain.minX, domain.maxX);
    setX(next);
    setStep((s) => s + 1);
    setHistory((h) => {
      const yNext = f(next);
      return [...h, { x: next, y: yNext }].slice(-200);
    });
  };

  const reset = () => {
    const x0 = -1.6;
    setRunning(false);
    setX(x0);
    setStep(0);
    setHistory([{ x: x0, y: f(x0) }]);
  };

  useEffect(() => {
    if (!running) {
      return;
    }

    const t = window.setInterval(() => {
      stepOnce();
    }, stepMs);

    return () => {
      window.clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, stepMs, lr, x]);

  return (
    <HStack align="stretch" spacing={0} w="100%" h="100vh">
      {/* Left panel */}
      <Box
        w="360px"
        bg="gray.900"
        color="white"
        borderRightWidth="1px"
        borderRightColor="whiteAlpha.200"
        p={4}
      >
        <VStack align="stretch" spacing={4}>
          <Box>
            <Text fontSize="lg" fontWeight="bold">
              Gradient Descent
            </Text>
            <Text fontSize="sm" opacity={0.8}>
              xₜ₊₁ = xₜ − η · f&#8242;(xₜ)
            </Text>
          </Box>

          <Box>
            <Text fontSize="sm" opacity={0.8}>
              Step
            </Text>
            <Text fontSize="2xl" fontWeight="bold">
              {step}
            </Text>
          </Box>

          <Box>
            <Text fontSize="sm" opacity={0.8}>
              Current x
            </Text>
            <Text fontFamily="mono">{x.toFixed(6)}</Text>

            <Text fontSize="sm" opacity={0.8} mt={2}>
              f(x)
            </Text>
            <Text fontFamily="mono">{y.toFixed(6)}</Text>

            <Text fontSize="sm" opacity={0.8} mt={2}>
              f&#8242;(x) (gradient)
            </Text>
            <Text fontFamily="mono">{grad.toFixed(6)}</Text>

            <Text fontSize="sm" opacity={0.8} mt={2}>
              Next x
            </Text>
            <Text fontFamily="mono">{xNext.toFixed(6)}</Text>
          </Box>

          <Box>
            <Text fontSize="sm" opacity={0.8}>
              Learning rate (η): {lr.toFixed(3)}
            </Text>
            <Slider
              min={0.001}
              max={0.2}
              step={0.001}
              value={lr}
              onChange={(v) => {
                setLr(v);
              }}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
          </Box>

          <Box>
            <Text fontSize="sm" opacity={0.8}>
              Step interval: {stepMs} ms
            </Text>
            <Slider
              min={30}
              max={800}
              step={10}
              value={stepMs}
              onChange={(v) => {
                setStepMs(v);
              }}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
          </Box>

          <HStack>
            <Button
              onClick={() => {
                setRunning((r) => !r);
              }}
            >
              {running ? "Pause" : "Play"}
            </Button>

            <Button
              onClick={() => {
                stepOnce();
              }}
              {...darkSecondaryButtonProps}
            >
              Step
            </Button>

            <Button
              onClick={() => {
                reset();
              }}
              {...darkSecondaryButtonProps}
            >
              Reset
            </Button>
            <AlgorithmDialogButton
              title={GRADIENT_DESCENT_ALGO.title}
              summary={GRADIENT_DESCENT_ALGO.summary}
              steps={GRADIENT_DESCENT_ALGO.steps}
              code={GRADIENT_DESCENT_ALGO.code}
              note={GRADIENT_DESCENT_ALGO.note}
            />
          </HStack>

          <Text fontSize="xs" opacity={0.7}>
            Function: f(x) = x⁴ − 3x² + 2
          </Text>
        </VStack>

        <GradientDescentFormula />
      </Box>

      {/* Plot */}
      <Box flex="1" bg="white">
        <Box
          w="100%"
          h="100%"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <svg
            width={W}
            height={H}
            style={{ maxWidth: "100%", height: "auto" }}
          >
            {/* axes */}
            <line
              x1={margin}
              y1={H - margin}
              x2={W - margin}
              y2={H - margin}
              stroke="rgba(0,0,0,0.25)"
            />
            <line
              x1={margin}
              y1={margin}
              x2={margin}
              y2={H - margin}
              stroke="rgba(0,0,0,0.25)"
            />

            {/* curve */}
            <path
              d={curvePath}
              fill="none"
              stroke="rgba(0,0,0,0.65)"
              strokeWidth={2}
            />

            {/* trace */}
            <path
              d={tracePath}
              fill="none"
              stroke="rgba(0,0,0,0.35)"
              strokeWidth={2}
            />

            {/* point */}
            <circle cx={sx(x)} cy={sy(y)} r={7} fill="orange" />

            {/* tangent arrow-ish line to next */}
            <line
              x1={sx(x)}
              y1={sy(y)}
              x2={sx(xNext)}
              y2={sy(f(xNext))}
              stroke="rgba(255,165,0,0.6)"
              strokeWidth={3}
            />
          </svg>
        </Box>
      </Box>
    </HStack>
  );
};

export default GradientDescent;
