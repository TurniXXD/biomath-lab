"use client";

import { Box, Button, Stack, Heading } from "@chakra-ui/react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Stack spacing={4} w="300px">
        <Heading size="md" textAlign="center">
          Sign in
        </Heading>

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
    </Box>
  );
}
