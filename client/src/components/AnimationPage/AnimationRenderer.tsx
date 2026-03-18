"use client";

import {
  AnimationId,
  animationRegistry,
} from "@/components/Animations/animationtsRegistry";
import dynamic from "next/dynamic";

type Props = {
  id: AnimationId;
};

const AnimationRenderer = ({ id }: Props) => {
  const DynamicAnimation = dynamic(animationRegistry[id].src, {
    ssr: false,
    loading: () => <div>Loading animation…</div>,
  });

  return <DynamicAnimation />;
};

export default AnimationRenderer;
