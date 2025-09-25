"use client";

import { useState } from "react";
import { DeleteTodo, UpdateInvoiceTodo } from "../todo/buttons";
import { TbArrowsUpDown } from "react-icons/tb";

interface Todo {
  id: string;
  title: string;
}

interface Props {
  todos: Todo[];
}

function move<T>(arr: T[], from: number, to: number) {
  if (from === -1 || to === -1 || from === to) return arr;
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export default function TableTodoShop({ todos: initialTodos }: Props) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [dragId, setDragId] = useState<string | null>(null);

  const [touchXY, setTouchXY] = useState<{ x: number; y: number } | null>(null);

  // Создание тени для мыши
  const createShadow = (e: React.DragEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLElement).style.boxShadow =
      "0 10px 20px rgba(0, 0, 0, 0.6)";
  };
  // Создание тени для touch
  const createShadowTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLElement).style.boxShadow =
      "0 10px 20px rgba(0, 0, 0, 0.6)";
  };
  // Очистка тени для мыши
  const clearShadow = (e: React.DragEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLElement).style.boxShadow = "";
  };
  // Очистка тени для touch
  const clearShadowTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLElement).style.boxShadow = "";
  };

  // HTML5 DnD (мышь)
  const onDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    setDragId(id);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    createShadow(e);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    const from = todos.findIndex((t) => t.id === dragId);
    const to = todos.findIndex((t) => t.id === targetId);
    setTodos((prev) => move(prev, from, to));
    clearShadow(e);
    setDragId(null);
  };

  // Touch DnD (мобильные)
  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>, id: string) => {
    if (e.touches.length !== 1) return;
    setDragId(id);
    const t = e.touches[0];
    setTouchXY({ x: t.clientX, y: t.clientY });
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!dragId) return;
    // Блокируем скролл страницы во время перетаскивания
    e.preventDefault();
    const t = e.touches[0];
    setTouchXY({ x: t.clientX, y: t.clientY });
    createShadowTouch(e);
  };

  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!dragId || !touchXY) {
      setDragId(null);
      setTouchXY(null);
      return;
    }

    // Элемент под пальцем в момент отпускания
    const el = document.elementFromPoint(
      touchXY.x,
      touchXY.y
    ) as HTMLElement | null;

    // Ищем ближайший контейнер карточки с data-id
    let node: HTMLElement | null = el;
    let targetId: string | null = null;
    while (node) {
      if (node.dataset && node.dataset.id) {
        targetId = node.dataset.id;
        break;
      }
      node = node.parentElement;
    }

    if (targetId) {
      const from = todos.findIndex((t) => t.id === dragId);
      const to = todos.findIndex((t) => t.id === targetId);
      setTodos((prev) => move(prev, from, to));
    }
    clearShadowTouch(e);
    setDragId(null);
    setTouchXY(null);
  };

  return (
    <div className="flow-root">
      <div className="min-w-full text-gray-900">
        <div className="bg-amber-100">
          {todos.map((todo) => (
            <div
              key={todo.id} // используем стабильный ключ
              data-id={todo.id} // нужно для touch drop через elementFromPoint
              draggable
              onDragStart={(e) => onDragStart(e, todo.id)}
              onDragLeave={clearShadow}
              onDragEnd={clearShadow}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, todo.id)}
              onTouchStart={(e) => onTouchStart(e, todo.id)}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              className="flex items-center bg-white border-gray-500 border-2 md:border-3 mb-1 md:mb-2 rounded w-full text-sm cursor-move touch-none select-none"
            >
              <div className="p-1 md:p-2">
                <TbArrowsUpDown className="w-5 h-5 cursor-grab" />
              </div>
              <div className="w-full">{todo.title}</div>
              <div className="flex p-1 md:p-1 items-center justify-end">
                <UpdateInvoiceTodo id={todo.id} />
                <DeleteTodo title={todo.title} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
