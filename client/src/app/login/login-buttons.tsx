"use client";

import { Button, Stack, Text } from "@chakra-ui/react";
import { signIn } from "next-auth/react";
import { Github, Mail } from "lucide-react";

type LoginButtonsProps = {
  callbackUrl: string;
};

export default function LoginButtons({ callbackUrl }: LoginButtonsProps) {
  return (
    <Stack spacing={3}>
      <Button
        leftIcon={<Mail size={16} />}
        size="lg"
        h={12}
        bg="white"
        color="gray.900"
        _hover={{ bg: "gray.100" }}
        onClick={() => {
          void signIn("google", { callbackUrl });
        }}
      >
        Continue with Google
      </Button>

      <Button
        leftIcon={<Github size={16} />}
        size="lg"
        h={12}
        variant="outline"
        borderColor="whiteAlpha.500"
        color="white"
        _hover={{ bg: "whiteAlpha.100" }}
        onClick={() => {
          void signIn("github", { callbackUrl });
        }}
      >
        Continue with GitHub
      </Button>

      <Text fontSize="xs" color="whiteAlpha.600" textAlign="center" pt={1}>
        By signing in you agree to use the app as a personal research workspace.
      </Text>
    </Stack>
  );
}
