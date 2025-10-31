import { inter } from "@/app/ui/fonts";

export default async function Page() {
  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${inter.className} text-2xl`}>Дела</h1>
      </div>
    </div>
  );
}
