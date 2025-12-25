import Breadcrumbs from "@/app/ui/breadcrumbs";
import CreateFood from "@/app/ui/graph/create-food";

export default function Page() {
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: "График", href: "/dashboard/graph" },
          {
            label: "Добавить еду",
            href: "/dashboard/create-food",
            active: true,
          },
        ]}
      />
      <CreateFood />
    </main>
  );
}
