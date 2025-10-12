import SideNav from "../ui/dashboard/sidenav";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[100svh] flex-col md:flex-row overflow-hidden">
      <div className="flex-none w-full md:w-64">
        <SideNav />
      </div>
      <div className="flex-1 min-h-0 bg-amber-100 p-3 md:p-12 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
