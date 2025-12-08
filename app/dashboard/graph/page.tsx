import { GraphContent } from "@/app/ui/graph/graph-content";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <div className="flex h-full flex-col overflow-y-auto overscroll-contain">
      <GraphContent />
    </div>
  );
}
