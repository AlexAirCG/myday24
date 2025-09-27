// "use client";

// import { useState, useRef } from "react";
// import { DeleteTodo, UpdateInvoiceTodo } from "../todo/buttons";
// import { TbArrowsUpDown } from "react-icons/tb";

// interface Todo {
//   id: string;
//   title: string;
// }

// interface Props {
//   todos: Todo[];
// }

// function move<T>(arr: T[], from: number, to: number) {
//   if (from === -1 || to === -1 || from === to) return arr;
//   const copy = [...arr];
//   const [item] = copy.splice(from, 1);
//   copy.splice(to, 0, item);
//   return copy;
// }

// // Ближайший ancestor с data-id
// function getIdFromNode(node: HTMLElement | null): string | null {
//   let el: HTMLElement | null = node;
//   while (el) {
//     const id = el.dataset?.id;
//     if (id) return id;
//     el = el.parentElement;
//   }
//   return null;
// }

// // elementFromPoint, игнорируя перетаскиваемый элемент
// function elementFromPointIgnoringDragged(
//   x: number,
//   y: number,
//   draggedId: string | null
// ): HTMLElement | null {
//   const draggedEl = draggedId
//     ? (document.querySelector(`[data-id="${draggedId}"]`) as HTMLElement | null)
//     : null;

//   let saved: string | null = null;
//   if (draggedEl) {
//     saved = draggedEl.style.pointerEvents;
//     draggedEl.style.pointerEvents = "none";
//   }
//   const el = document.elementFromPoint(x, y) as HTMLElement | null;
//   if (draggedEl) {
//     draggedEl.style.pointerEvents = saved ?? "";
//   }
//   return el;
// }

// export default function TableTodoShop({ todos: initialTodos }: Props) {
//   const [todos, setTodos] = useState<Todo[]>(initialTodos);

//   // DnD state
//   const [dragId, setDragId] = useState<string | null>(null);
//   const [hoverId, setHoverId] = useState<string | null>(null);

//   // Touch preview state
//   const [touchXY, setTouchXY] = useState<{ x: number; y: number } | null>(null);
//   const [dragOffset, setDragOffset] = useState<{
//     dx: number;
//     dy: number;
//   } | null>(null);
//   const [dragSize, setDragSize] = useState<{ w: number; h: number } | null>(
//     null
//   );

//   // throttle для автоскролла
//   const lastAutoScroll = useRef<number>(0);

//   // ==== МЫШЬ (HTML5 DnD) ====
//   const createShadow = (e: React.DragEvent<HTMLDivElement>) => {
//     (e.currentTarget as HTMLElement).style.boxShadow =
//       "0 8px 10px rgba(0,0,0,0.6)";
//   };
//   const clearShadow = (e: React.DragEvent<HTMLDivElement>) => {
//     (e.currentTarget as HTMLElement).style.boxShadow = "";
//   };

//   const onDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
//     setDragId(id);
//   };

//   const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     createShadow(e);
//   };

//   const onDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
//     e.preventDefault();
//     const from = todos.findIndex((t) => t.id === dragId);
//     const to = todos.findIndex((t) => t.id === targetId);
//     setTodos((prev) => move(prev, from, to));
//     clearShadow(e);
//     setDragId(null);
//   };

//   // ==== TOUCH DnD ====
//   const onTouchStart = (e: React.TouchEvent<HTMLDivElement>, id: string) => {
//     if (e.touches.length !== 1) return;
//     const t = e.touches[0];
//     const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

//     setDragId(id);
//     setTouchXY({ x: t.clientX, y: t.clientY });
//     setDragOffset({ dx: t.clientX - rect.left, dy: t.clientY - rect.top });
//     setDragSize({ w: rect.width, h: rect.height });
//     setHoverId(id);
//   };

//   const autoScrollIfNearEdge = (y: number) => {
//     const now = performance.now();
//     if (now - lastAutoScroll.current < 16) return; // ~60fps
//     const margin = 60; // зона у краёв
//     const speed = 14; // px за тик

//     const vh = window.innerHeight;
//     if (y < margin) {
//       window.scrollBy(0, -speed);
//       lastAutoScroll.current = now;
//     } else if (y > vh - margin) {
//       window.scrollBy(0, speed);
//       lastAutoScroll.current = now;
//     }
//   };

//   const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
//     if (!dragId) return;
//     e.preventDefault();

//     const t = e.touches[0];
//     const x = t.clientX;
//     const y = t.clientY;
//     setTouchXY({ x, y });

//     autoScrollIfNearEdge(y);

//     // Находим элемент/строку под пальцем
//     const el = elementFromPointIgnoringDragged(x, y, dragId);
//     const targetId = getIdFromNode(el);

//     // Подсветка
//     setHoverId(targetId ?? null);

//     // Динамическая перестановка
//     if (targetId && targetId !== dragId) {
//       setTodos((prev) => {
//         const from = prev.findIndex((t) => t.id === dragId);
//         const to = prev.findIndex((t) => t.id === targetId);
//         return move(prev, from, to);
//       });
//     }
//   };

//   const onTouchEnd = () => {
//     // Ничего дополнительно делать не нужно, порядок уже переставлен на лету.
//     setDragId(null);
//     setTouchXY(null);
//     setDragOffset(null);
//     setDragSize(null);
//     setHoverId(null);
//   };

//   const draggingTodo = dragId ? todos.find((t) => t.id === dragId) : null;

//   return (
//     <div className="flow-root">
//       <div className="min-w-full text-gray-900">
//         <div className="bg-amber-100">
//           {todos.map((todo) => {
//             const isDragging = dragId === todo.id;
//             const isHover = hoverId === todo.id && !isDragging;

//             return (
//               <div
//                 key={todo.id}
//                 data-id={todo.id}
//                 draggable
//                 onDragStart={(e) => onDragStart(e, todo.id)}
//                 onDragLeave={clearShadow}
//                 onDragEnd={clearShadow}
//                 onDragOver={onDragOver}
//                 onDrop={(e) => onDrop(e, todo.id)}
//                 onTouchStart={(e) => onTouchStart(e, todo.id)}
//                 onTouchMove={onTouchMove}
//                 onTouchEnd={onTouchEnd}
//                 className={[
//                   "flex items-center bg-white border-gray-500 border-2 md:border-3 mb-1 md:mb-2 rounded w-full text-sm cursor-move touch-none select-none transition-shadow",
//                   "shadow-[0_4px_8px_rgba(0,0,0,0.3)]",
//                   isDragging ? "opacity-0" : "",
//                   isHover
//                     ? "ring-2 ring-amber-400 shadow-[0_8px_10px_rgba(0,0,0,0.6)]"
//                     : "",
//                 ].join(" ")}
//               >
//                 <div className="p-1 md:p-2">
//                   <TbArrowsUpDown className="w-5 h-5 cursor-grab" />
//                 </div>
//                 <div className="w-full">{todo.title}</div>
//                 <div className="flex p-1 md:p-1 items-center justify-end">
//                   <UpdateInvoiceTodo id={todo.id} />
//                   <DeleteTodo title={todo.title} />
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       {/* Превью перетаскиваемого элемента под пальцем */}
//       {dragId && touchXY && dragOffset && draggingTodo && (
//         <div
//           className="fixed z-50 pointer-events-none left-0 top-0 select-none"
//           style={{
//             transform: `translate(${touchXY.x - dragOffset.dx}px, ${
//               touchXY.y - dragOffset.dy
//             }px)`,
//           }}
//         >
//           <div
//             className={[
//               "flex items-center bg-white border-gray-500 border-2 md:border-3 rounded text-sm",
//               "shadow-[0_12px_20px_rgba(0,0,0,0.45)] ring-2 ring-amber-400",
//             ].join(" ")}
//             style={{
//               width: dragSize?.w,
//               height: dragSize?.h,
//             }}
//           >
//             <div className="p-1 md:p-2">
//               <TbArrowsUpDown className="w-5 h-5" />
//             </div>
//             <div className="w-full">{draggingTodo.title}</div>
//             <div className="flex p-1 md:p-1 items-center justify-end">
//               {/* Некликабельно из-за pointer-events: none на враппере */}
//               <UpdateInvoiceTodo id={draggingTodo.id} />
//               <DeleteTodo title={draggingTodo.title} />
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
// ============================================================================
"use client";

import { useEffect, useRef, useState } from "react";
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

// Ближайший ancestor с data-id
function getIdFromNode(node: HTMLElement | null): string | null {
  let el: HTMLElement | null = node;
  while (el) {
    const id = el.dataset?.id;
    if (id) return id;
    el = el.parentElement;
  }
  return null;
}

// elementFromPoint, игнорируя перетаскиваемый элемент
function elementFromPointIgnoringDragged(
  x: number,
  y: number,
  draggedId: string | null
): HTMLElement | null {
  const draggedEl = draggedId
    ? (document.querySelector(`[data-id="${draggedId}"]`) as HTMLElement | null)
    : null;

  let saved: string | null = null;
  if (draggedEl) {
    saved = draggedEl.style.pointerEvents;
    draggedEl.style.pointerEvents = "none";
  }
  const el = document.elementFromPoint(x, y) as HTMLElement | null;
  if (draggedEl) {
    draggedEl.style.pointerEvents = saved ?? "";
  }
  return el;
}

export default function TableTodoShop({ todos: initialTodos }: Props) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);

  // DnD state
  const [dragId, setDragId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  // Touch preview state
  const [touchXY, setTouchXY] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState<{
    dx: number;
    dy: number;
  } | null>(null);
  const [dragSize, setDragSize] = useState<{ w: number; h: number } | null>(
    null
  );

  // throttle для автоскролла
  const lastAutoScroll = useRef<number>(0);

  // ==== МЫШЬ (HTML5 DnD) ==== (стартуем ТОЛЬКО с ручки)
  const createShadow = (e: React.DragEvent<HTMLElement>) => {
    (e.currentTarget as HTMLElement).style.boxShadow =
      "0 8px 10px rgba(0,0,0,0.6)";
  };
  const clearShadow = (e: React.DragEvent<HTMLElement>) => {
    (e.currentTarget as HTMLElement).style.boxShadow = "";
  };

  const onHandleDragStart = (
    e: React.DragEvent<HTMLButtonElement>,
    id: string
  ) => {
    // скрываем стандартный "призрак"
    if (e.dataTransfer) {
      const img = new Image();
      img.src =
        "data:image/svg+xml;charset=utf-8," +
        encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg"/>');
      e.dataTransfer.setDragImage(img, 0, 0);
      e.dataTransfer.effectAllowed = "move";
    }
    setDragId(id);
  };

  const onRowDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    createShadow(e);
  };

  const onRowDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    if (!dragId) return;
    const from = todos.findIndex((t) => t.id === dragId);
    const to = todos.findIndex((t) => t.id === targetId);
    setTodos((prev) => move(prev, from, to));
    clearShadow(e);
    setDragId(null);
  };

  // ==== TOUCH DnD (стартуем ТОЛЬКО с ручки) ====
  const onHandleTouchStart = (
    e: React.TouchEvent<HTMLButtonElement>,
    id: string
  ) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    const row = (e.currentTarget as HTMLElement).closest(
      "[data-id]"
    ) as HTMLElement | null;
    if (!row) return;
    const rect = row.getBoundingClientRect();

    setDragId(id);
    setTouchXY({ x: t.clientX, y: t.clientY });
    setDragOffset({ dx: t.clientX - rect.left, dy: t.clientY - rect.top });
    setDragSize({ w: rect.width, h: rect.height });
    setHoverId(id);
  };

  const autoScrollIfNearEdge = (y: number) => {
    const now = performance.now();
    if (now - lastAutoScroll.current < 16) return; // ~60fps
    const margin = 60;
    const speed = 14;

    const vh = window.innerHeight;
    if (y < margin) {
      window.scrollBy(0, -speed);
      lastAutoScroll.current = now;
    } else if (y > vh - margin) {
      window.scrollBy(0, speed);
      lastAutoScroll.current = now;
    }
  };

  // глобальные обработчики touch-перетаскивания во время активного dnd
  const containerRef = useRef<HTMLDivElement | null>(null);

  const onTouchMoveCapture = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!dragId) return;
    e.preventDefault();
    const t = e.touches[0];
    const x = t.clientX;
    const y = t.clientY;
    setTouchXY({ x, y });

    autoScrollIfNearEdge(y);

    const el = elementFromPointIgnoringDragged(x, y, dragId);
    const targetId = getIdFromNode(el);
    setHoverId(targetId ?? null);

    if (targetId && targetId !== dragId) {
      setTodos((prev) => {
        const from = prev.findIndex((t) => t.id === dragId);
        const to = prev.findIndex((t) => t.id === targetId);
        return move(prev, from, to);
      });
    }
  };

  const onTouchEndCapture = () => {
    if (!dragId) return;
    setDragId(null);
    setTouchXY(null);
    setDragOffset(null);
    setDragSize(null);
    setHoverId(null);
  };

  const draggingTodo = dragId ? todos.find((t) => t.id === dragId) : null;

  return (
    <div
      className="flow-root"
      ref={containerRef}
      onTouchMoveCapture={onTouchMoveCapture}
      onTouchEndCapture={onTouchEndCapture}
    >
      <div className="min-w-full text-gray-900">
        <div className="bg-amber-100">
          {todos.map((todo) => {
            const isDragging = dragId === todo.id;
            const isHover = hoverId === todo.id && !isDragging;

            return (
              <div
                key={todo.id}
                data-id={todo.id}
                // ВАЖНО: строка НЕ draggable
                onDragOver={onRowDragOver}
                onDragLeave={clearShadow}
                onDragEnd={clearShadow}
                onDrop={(e) => onRowDrop(e, todo.id)}
                className={[
                  "flex items-center bg-white border-gray-500 border-2 md:border-3 mb-1 md:mb-2 rounded w-full text-sm touch-none select-none transition-shadow",
                  "shadow-[0_4px_8px_rgba(0,0,0,0.3)]",
                  isDragging ? "opacity-0" : "",
                  isHover
                    ? "ring-2 ring-amber-400 shadow-[0_8px_10px_rgba(0,0,0,0.6)]"
                    : "",
                ].join(" ")}
              >
                {/* Ручка DnD: ТОЛЬКО тут можно начать перетаскивать */}
                <button
                  type="button"
                  aria-label="Перетащить"
                  className="p-1 md:p-2 cursor-grab active:cursor-grabbing"
                  draggable
                  onDragStart={(e) => onHandleDragStart(e, todo.id)}
                  onTouchStart={(e) => onHandleTouchStart(e, todo.id)}
                >
                  <TbArrowsUpDown className="w-5 h-5" />
                </button>

                <div className="w-full select-text">{todo.title}</div>

                <div className="flex p-1 md:p-1 items-center justify-end">
                  <UpdateInvoiceTodo id={todo.id} />
                  <DeleteTodo title={todo.title} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Превью перетаскиваемого элемента под пальцем (только для touch) */}
      {dragId && touchXY && dragOffset && draggingTodo && (
        <div
          className="fixed z-50 pointer-events-none left-0 top-0 select-none"
          style={{
            transform: `translate(${touchXY.x - dragOffset.dx}px, ${
              touchXY.y - dragOffset.dy
            }px)`,
          }}
        >
          <div
            className={[
              "flex items-center bg-white border-gray-500 border-2 md:border-3 rounded text-sm",
              "shadow-[0_12px_20px_rgba(0,0,0,0.45)] ring-2 ring-amber-400",
            ].join(" ")}
            style={{
              width: dragSize?.w,
              height: dragSize?.h,
            }}
          >
            <div className="p-1 md:p-2">
              <TbArrowsUpDown className="w-5 h-5" />
            </div>
            <div className="w-full">{draggingTodo.title}</div>
            <div className="flex p-1 md:p-1 items-center justify-end">
              {/* Некликабельно из-за pointer-events: none на враппере */}
              <UpdateInvoiceTodo id={draggingTodo.id} />
              <DeleteTodo title={draggingTodo.title} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
