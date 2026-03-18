"use client";

import { Box, Button, Stack, Heading } from "@chakra-ui/react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
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

        <Button colorScheme="red" onClick={() => signIn("google")}>
          Continue with Google
        </Button>

        <Button colorScheme="gray" onClick={() => signIn("github")}>
          Continue with GitHub
        </Button>
      </Stack>
    </Box>
  );
}
