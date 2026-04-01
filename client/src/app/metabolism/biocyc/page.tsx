import KnowledgeExplorer from "@/components/Metabolism/KnowledgeExplorer";

export default function MetabolismBioCycPage() {
  return (
    <KnowledgeExplorer
      provider="biocyc"
      title="BioCyc Explorer"
      description="Search BioCyc pathway names from the backend and inspect pathway candidates for general metabolism knowledge."
      placeholder="e.g. glycolysis"
      hint="Uses BioCyc web services name-search against the MetaCyc/BioCyc pathway collection."
      defaultQuery="glycolysis"
    />
  );
}
