import { defineConfig } from "orval";

export default defineConfig({
  biomath: {
    input: "http://localhost:8000/openapi.json",
    output: {
      mode: "single",
      target: "src/lib/api/generated/api.ts",
      client: "react-query",
      prettier: true,
      clean: true,
      override: {
        mutator: {
          path: "src/lib/api/client.ts",
          name: "axiosInstance",
        },
      },
    },
  },
});
