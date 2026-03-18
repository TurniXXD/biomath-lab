import { Heading, Text, VStack } from "@chakra-ui/react";

export default function SvdPage() {
  return (
    <VStack align="start" spacing={4}>
      <Heading>SVD</Heading>
      <Text>
        Singular Value Decomposition factorizes a matrix into U, Σ, and Vᵀ.
      </Text>
      todo
      <ul>
        <li>Orthogonal matrices</li>
        <li>Eigenvalues and eigenvectors</li>
      </ul>
      A = U \Sigma V^T
      <ul>
        <li>U = orthogonal matrix (left singular vectors)</li>
        <li>V = orthogonal matrix (right singular vectors)</li>
        <li>\Sigma = diagonal matrix with nonnegative numbers</li>
      </ul>
    </VStack>
  );
}
