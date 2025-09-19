import { fetchTodo, fetchTodoById } from "@/app/lib/data";
import Breadcrumbs from "@/app/ui/todo/breadcrumbs";
import EditTodo from "@/app/ui/todo/edit-todo";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;
  const [title] = await Promise.all([fetchTodoById(id)]);
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: "Baty", href: "/dashboard/todo" },
          {
            label: "Edit Weather",
            href: `/dashboard/todo/${id}/edit`,
            active: true,
          },
        ]}
      />
      <EditTodo title={title} />
    </main>
  );
}
