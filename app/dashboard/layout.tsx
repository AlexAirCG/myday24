import { fetchUserEmail } from "../lib/data";
import SideNav from "../ui/dashboard/sidenav";

export const dynamic = "force-dynamic";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const email = await fetchUserEmail(); // string | null

  return (
    <div className="flex h-[100svh] flex-col md:flex-row overflow-hidden">
      <div className="flex-none w-full md:w-64">
        {/* ✅ Передаем строку/nullable */}
        <SideNav email={email} />
      </div>
      <div className="flex-1 min-h-0 bg-sky-200 p-3 md:p-12 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
