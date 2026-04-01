import KnowledgeExplorer from "@/components/Metabolism/KnowledgeExplorer";

export default function MetabolismKeggPage() {
  return (
    <KnowledgeExplorer
      provider="kegg"
      title="KEGG Explorer"
      description="Search KEGG pathway records from the metabolism section and inspect pathway-level matches through the backend."
      placeholder="e.g. glycolysis"
      hint="Uses the official KEGG REST search endpoint for pathway lookup."
      defaultQuery="glycolysis"
    />
  );
}
