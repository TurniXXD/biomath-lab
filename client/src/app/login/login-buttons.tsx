"use client";

import { Button, Stack } from "@chakra-ui/react";
import { signIn } from "next-auth/react";

type LoginButtonsProps = {
  callbackUrl: string;
};

export default function LoginButtons({ callbackUrl }: LoginButtonsProps) {
  return (
    <Stack spacing={3}>
      <Button
        colorScheme="red"
        onClick={() => {
          void signIn("google", { callbackUrl });
        }}
      >
        Continue with Google
      </Button>

      <Button
        colorScheme="gray"
        onClick={() => {
          void signIn("github", { callbackUrl });
        }}
      >
        Continue with GitHub
      </Button>
    </Stack>
  );
}
