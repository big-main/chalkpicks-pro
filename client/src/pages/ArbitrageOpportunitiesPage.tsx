import { PageMeta } from "@/components/PageMeta";
import { ArbitrageOpportunities } from "@/components/ArbitrageOpportunities";

export function ArbitrageOpportunitiesPage() {
  return (
    <>
      <PageMeta pathname="/arbitrage-opportunities" />
      <div className="container mx-auto px-4 py-8">
        <ArbitrageOpportunities />
      </div>
    </>
  );
}
