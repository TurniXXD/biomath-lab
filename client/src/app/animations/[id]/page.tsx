// src/app/animations/[id]/page.tsx
import AnimationRenderer from "@/components/AnimationPage/AnimationRenderer";
import {
  animationRegistry,
  AnimationId,
} from "@/components/Animations/animationtsRegistry";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

const Page = async ({ params }: PageProps) => {
  const { id } = await params;

  if (!(id in animationRegistry)) {
    notFound();
  }

  return <AnimationRenderer id={id as AnimationId} />;
};

export default Page;
