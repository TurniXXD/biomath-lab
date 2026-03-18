interface DropZoneProps {
  label: string;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  compact?: boolean;
}

export const DropZone = ({
  label,
  onDrop,
  onDragOver,
  compact,
}: DropZoneProps) => {
  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      style={{
        border: "1px dashed #bbb",
        borderRadius: 12,
        padding: compact ? 10 : 14,
        background: "#fafafa",
        color: "#333",
        opacity: 0.9,
        marginBottom: 10,
      }}
      title={label}
    >
      <span style={{ fontSize: 12, opacity: 0.75 }}>{label}</span>
    </div>
  );
};
