"use client";

import MatrixPageContent from "@/components/MatrixPage/MatrixPage";

export default function Page() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>Matrix transformations</h1>
      <div style={{ opacity: 0.75, marginBottom: 16 }}>
        Drag matrices from the library into the viewport. Choose <b>+</b> or{" "}
        <b>×</b> between them. Result updates live.
      </div>

      <MatrixPageContent />
    </div>
  );
}
