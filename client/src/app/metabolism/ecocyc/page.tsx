import KnowledgeExplorer from "@/components/Metabolism/KnowledgeExplorer";

export default function MetabolismEcoCycPage() {
  return (
    <KnowledgeExplorer
      provider="ecocyc"
      title="EcoCyc Explorer"
      description="Search EcoCyc pathway names from the backend for E. coli-centered metabolism exploration."
      placeholder="e.g. glycolysis"
      hint="Uses BioCyc web services name-search against the ECOLI organism database."
      defaultQuery="glycolysis"
    />
  );
}
