"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "../button";
import { IoTrashOutline } from "react-icons/io5";

type BudgetItem = {
  id: string;
  title: string;
  percent: number;
};

type AnyFn<Args extends unknown[] = unknown[], R = unknown> = (
  ...args: Args
) => R;

function debounce<Args extends unknown[]>(
  fn: AnyFn<Args, void | Promise<void>>,
  ms: number
): (...args: Args) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      void fn(...args);
    }, ms);
  };
}
// function debounce<T extends (...args: any[]) => void | Promise<void>>(
//   fn: T,
//   ms: number
// ) {
//   let timer: ReturnType<typeof setTimeout> | null = null;
//   return (...args: Parameters<T>) => {
//     if (timer) clearTimeout(timer);
//     timer = setTimeout(() => fn(...args), ms);
//   };
// }
// function debounce<T extends (...args: any[]) => void>(fn: T, ms: number) {
//   let timer: any;
//   return (...args: Parameters<T>) => {
//     clearTimeout(timer);
//     timer = setTimeout(() => fn(...args), ms);
//   };
// }

export default function BudgetPercent() {
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [totalBudget, setTotalBudget] = useState<number>(0);
  const [newTitle, setNewTitle] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [savingTotal, setSavingTotal] = useState<boolean>(false);

  // Первичная загрузка из БД
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/budget", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load");
        const data: { totalBudget: number; items: BudgetItem[] } =
          await res.json();
        if (!cancelled) {
          setItems(
            (data.items || []).map((it) => ({
              id: String(it.id),
              title: String(it.title ?? ""),
              percent: Number(it.percent ?? 0),
            }))
          );
          setTotalBudget(
            Number.isFinite(data.totalBudget) ? data.totalBudget : 0
          );
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Дебаунс сохранения общей суммы бюджета
  const debouncedSaveTotal = React.useMemo(
    () =>
      debounce(async (val: number) => {
        try {
          setSavingTotal(true);
          await fetch("/api/budget/total", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ total: val }),
          });
        } catch (e) {
          console.error(e);
        } finally {
          setSavingTotal(false);
        }
      }, 500),
    []
  );

  const handleTotalBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const normalized = Number.isFinite(val) ? val : 0;
    setTotalBudget(normalized);
    debouncedSaveTotal(normalized);
  };

  const handleNewTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTitle(e.target.value);
  };

  const addItem = async () => {
    const title = newTitle.trim();
    if (!title) {
      alert("Введите название статьи");
      return;
    }
    setNewTitle("");

    // Оптимистично добавим временный элемент, пока ждём id
    const tempId = `temp-${Date.now()}`;
    setItems((prev) => [...prev, { id: tempId, title, percent: 0 }]);

    try {
      const res = await fetch("/api/budget/item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Failed to add item");
      const row: BudgetItem = await res.json();

      // Заменим временный элемент на элемент с реальным id
      setItems((prev) =>
        prev.map((it) => (it.id === tempId ? { ...row } : it))
      );
    } catch (e) {
      console.error(e);
      // Откат — уберём временный элемент
      setItems((prev) => prev.filter((it) => it.id !== tempId));
      alert("Не удалось добавить статью");
    }
  };

  const updateItemPercent = async (index: number, value: string) => {
    const percent = parseFloat(value);
    const normalized = Number.isFinite(percent) ? percent : 0;

    const target = items[index];
    if (!target) return;

    // Оптимистичное обновление
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, percent: normalized } : it))
    );

    try {
      await fetch("/api/budget/item", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: target.id, percent: normalized }),
      });
    } catch (e) {
      console.error(e);
      alert("Не удалось сохранить процент");
      // (по желанию) можно перезагрузить из БД
    }
  };

  const deleteItem = async (index: number) => {
    const target = items[index];
    if (!target) return;

    // Оптимистично удалить
    setItems((prev) => prev.filter((_, i) => i !== index));

    try {
      const res = await fetch(`/api/budget/item/${target.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
    } catch (e) {
      console.error(e);
      alert("Не удалось удалить статью");
      // Откат
      setItems((prev) => {
        const copy = [...prev];
        copy.splice(index, 0, target);
        return copy;
      });
    }
  };

  // Derived values
  const totalUsedPercent = useMemo(
    () => items.reduce((acc, it) => acc + (Number(it.percent) || 0), 0),
    [items]
  );

  const percentRemaining = useMemo(
    () => 100 - totalUsedPercent,
    [totalUsedPercent]
  );

  return (
    <div
      id="container max-h-[500px] overflow-y-auto"
      className="bg-white border-2 border-gray-400 p-[10px] rounded-[5px] w-fit"
    >
      <div id="title" className="text-[18px] mb-[5px] text-center">
        Бюджет
      </div>

      <div id="sumBudget">
        <div id="sumTitle" className="mb-1">
          Сумма бюджета
        </div>
        <input
          id="sumInput"
          type="number"
          inputMode="decimal"
          className="rounded-md bg-white border-gray-500 border-2 px-3 py-2 text-sm shadow-[0_4px_8px_rgba(0,0,0,0.3)] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          value={Number.isFinite(totalBudget) ? totalBudget : ""}
          onChange={handleTotalBudgetChange}
          placeholder={loading ? "Загрузка..." : "0"}
        />
        {savingTotal && (
          <div className="text-xs text-gray-500 mt-1">Сохранение...</div>
        )}
      </div>

      <div id="blockBudget" className="mt-3">
        {items.map((item, index) => {
          const itemSum =
            ((Number(totalBudget) || 0) * (Number(item.percent) || 0)) / 100;
          return (
            <div
              key={item.id}
              className="itemBudget flex items-center mb-2 border-2 border-gray-500 rounded shadow-[0_4px_8px_rgba(0,0,0,0.3)] p-1 w-fit"
            >
              <div className="itemBudgetTitle mr-2 ml-2">{item.title}</div>
              <input
                className="itemPercent w-[90px] rounded-md bg-white border-gray-500 border-2 px-2 py-1 text-sm  focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                value={Number.isFinite(item.percent) ? item.percent : ""}
                onChange={(e) => updateItemPercent(index, e.target.value)}
                placeholder="%"
              />
              <div className="percent">% =</div>
              <div className="sumItem mr-2 ml-2">{itemSum.toFixed(2)}</div>
              {/* <Button
                onClick={() => deleteItem(index)}
                className="btnDelet rounded-md bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-sm"
              >
                Удалить
              </Button> */}
              <button
                className="p-1 border-gray-500 border-2 rounded hover:border-red-700 cursor-pointer active:bg-red-700 transition-colors duration-150 ease-out"
                // type="submit"
                // aria-label="Удалить"
                // title="Удалить"
                onClick={() => deleteItem(index)}
              >
                <IoTrashOutline className="w-5 h-5 hover:text-red-700" />
              </button>
            </div>
          );
        })}
        {loading && (
          <div className="text-sm text-gray-500 mt-2">Загрузка статей...</div>
        )}
      </div>

      <div className="percentInf flex w-fit gap-[5px] mt-1 rounded-md bg-white border-gray-500 border-2 px-3 py-2 text-sm shadow-[0_4px_8px_rgba(0,0,0,0.3)]">
        <div>Осталось %</div>
        <div className={percentRemaining < 0 ? "text-red-600" : "text-black"}>
          {Number.isFinite(percentRemaining) ? percentRemaining : 0}
        </div>
      </div>

      <div id="newBudgetItem" className="mt-3">
        <div id="newBudgetTitle" className="mb-1.5">
          Добавить статью бюджета
        </div>
        <div className="flex items-center gap-2">
          <input
            id="titleInput"
            className="mt-1 rounded-md bg-white border-gray-500 border-2 px-3 py-2 text-sm shadow-[0_4px_8px_rgba(0,0,0,0.3)] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            value={newTitle}
            onChange={handleNewTitleChange}
            placeholder="Название статьи"
          />
          <Button
            id="titleBtn"
            className="mt-1 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 text-sm shadow-[0_4px_8px_rgba(0,0,0,0.3)]"
            onClick={addItem}
          >
            Добавить
          </Button>
        </div>
      </div>
    </div>
  );
}
