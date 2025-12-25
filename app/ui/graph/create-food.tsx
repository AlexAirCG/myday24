"use client";

import { Button } from "../button";

export default function CreateFood() {
  return (
    <div className="relative">
      <form className="flex flex-col">
        <input
          placeholder="Название еды"
          className="mt-1 mb-3 w-full bg-white rounded-md  border-gray-500 border-2 px-3 py-2 text-sm shadow-[0_4px_8px_rgba(0,0,0,0.3)] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />

        <input
          placeholder=" ккал в 100г"
          className="mt-1 mb-3 w-40 bg-white rounded-md border-gray-500 border-2 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-[0_4px_8px_rgba(0,0,0,0.3)]"
        />
        <Button
          type="submit"
          title="Добавить новую задачу"
          className="p-2 w-full justify-center"
        >
          Добавить
        </Button>
      </form>
    </div>
  );
}
