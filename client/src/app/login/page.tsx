import { Box, Heading, Stack } from "@chakra-ui/react";
import type { Metadata } from "next";
import LoginButtons from "./login-buttons";

type LoginPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const callbackUrl = Array.isArray(searchParams?.callbackUrl)
    ? searchParams?.callbackUrl[0]
    : searchParams?.callbackUrl ?? "/";

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
      <Stack spacing={4} w="300px">
        <Heading size="md" textAlign="center">
          Sign in
        </Heading>
        <LoginButtons callbackUrl={callbackUrl} />
      </Stack>
    </Box>
  );
}
