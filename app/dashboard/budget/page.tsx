import BudgetPercent from "@/app/ui/budget/budget-percent";

export const dynamic = "force-dynamic";

export default async function Page() {
  return (
    <div className="flex flex-col items-start h-full">
      <BudgetPercent />
    </div>
  );
}
