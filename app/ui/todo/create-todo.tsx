"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createTodoFetch, toggleTodo } from "@/app/lib/actions";

type Suggestion = { id: string; title: string };

function useDebounce<T>(value: T, delay = 200) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function CreateTodo() {
  const [title, setTitle] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const debounced = useDebounce(title, 200);
  const showSuggestions = useMemo(
    () => open && debounced.trim().length >= 1,
    [open, debounced]
  );

  useEffect(() => {
    let aborted = false;

    async function fetchSuggestions() {
      const q = debounced.trim();
      if (q.length < 1) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(
          `/api/shop/search-completed?q=${encodeURIComponent(q)}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error("Search failed");
        const data = (await res.json()) as { items: Suggestion[] };
        if (!aborted) setSuggestions(data.items || []);
      } catch {
        if (!aborted) setSuggestions([]);
      } finally {
        if (!aborted) setLoading(false);
      }
    }

    fetchSuggestions();
    return () => {
      aborted = true;
    };
  }, [debounced]);

  const onPickSuggestion = (s: Suggestion) => {
    // "Воскрешаем" задачу: completed=false и переносим в начало
    startTransition(async () => {
      await toggleTodo(s.id);
      // очистка UI
      setTitle("");
      setSuggestions([]);
      setOpen(false);
    });
  };

  const onSubmit = () => {
    // После сабмита «новой» задачи чистим поле и подсказки
    setTimeout(() => {
      setTitle("");
      setSuggestions([]);
      setOpen(false);
    }, 0);
  };

  return (
    <div className="relative">
      <form
        action={createTodoFetch}
        className="flex gap-2 mb-4"
        onSubmit={onSubmit}
      >
        <input
          name="title"
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Небольшая задержка, чтобы успел отработать click по подсказке
            setTimeout(() => setOpen(false), 120);
          }}
          placeholder="Добавить покупку..."
          className="w-full p-2 rounded bg-white border-gray-500 border-2 md:border-3"
          autoComplete="off"
        />
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          disabled={isPending}
          title="Добавить новую задачу"
        >
          Добавить
        </button>
      </form>

      {showSuggestions && (
        <div className="absolute z-20 mt-[-0.5rem] w-full rounded border border-gray-300 bg-white shadow">
          {loading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Поиск…</div>
          ) : suggestions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              Такой покупки еще не было
            </div>
          ) : (
            <ul className="max-h-56 overflow-auto">
              {suggestions.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()} // чтобы blur input не съедал клик
                    onClick={() => onPickSuggestion(s)}
                    className="w-full text-left px-3 py-2 hover:bg-sky-50"
                    title="Добавить обратно в невыполненные"
                  >
                    {s.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
