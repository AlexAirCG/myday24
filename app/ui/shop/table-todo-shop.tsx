// "use client";

// import { useState } from "react";
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

// export default function TableTodoShop({ todos: initialTodos }: Props) {
//   const [todos, setTodos] = useState<Todo[]>(initialTodos);
//   const [dragId, setDragId] = useState<string | null>(null);

//   const [touchXY, setTouchXY] = useState<{ x: number; y: number } | null>(null);

//   // Создание тени для мыши
//   const createShadow = (e: React.DragEvent<HTMLDivElement>) => {
//     (e.currentTarget as HTMLElement).style.boxShadow =
//       "0 8px 10px rgba(0, 0, 0, 0.6)";
//   };
//   // Очистка тени для мыши
//   const clearShadow = (e: React.DragEvent<HTMLDivElement>) => {
//     (e.currentTarget as HTMLElement).style.boxShadow = "";
//   };

//   // HTML5 DnD (мышь)
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

//   // Touch DnD (мобильные)
//   const onTouchStart = (e: React.TouchEvent<HTMLDivElement>, id: string) => {
//     if (e.touches.length !== 1) return;
//     setDragId(id);
//     const t = e.touches[0];
//     setTouchXY({ x: t.clientX, y: t.clientY });
//   };

//   const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
//     if (!dragId) return;
//     // Блокируем скролл страницы во время перетаскивания
//     e.preventDefault();
//     const t = e.touches[0];
//     setTouchXY({ x: t.clientX, y: t.clientY });
//   };

//   const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
//     if (!dragId || !touchXY) {
//       setDragId(null);
//       setTouchXY(null);
//       return;
//     }

//     // Элемент под пальцем в момент отпускания
//     const el = document.elementFromPoint(
//       touchXY.x,
//       touchXY.y
//     ) as HTMLElement | null;

//     // Ищем ближайший контейнер карточки с data-id
//     let node: HTMLElement | null = el;
//     let targetId: string | null = null;
//     while (node) {
//       if (node.dataset && node.dataset.id) {
//         targetId = node.dataset.id;
//         break;
//       }
//       node = node.parentElement;
//     }

//     if (targetId) {
//       const from = todos.findIndex((t) => t.id === dragId);
//       const to = todos.findIndex((t) => t.id === targetId);
//       setTodos((prev) => move(prev, from, to));
//     }
//     setDragId(null);
//     setTouchXY(null);
//   };

//   return (
//     <div className="flow-root">
//       <div className="min-w-full text-gray-900">
//         <div className="bg-amber-100">
//           {todos.map((todo) => (
//             <div
//               key={todo.id} // используем стабильный ключ
//               data-id={todo.id} // нужно для touch drop через elementFromPoint
//               draggable
//               onDragStart={(e) => onDragStart(e, todo.id)}
//               onDragLeave={clearShadow}
//               onDragEnd={clearShadow}
//               onDragOver={onDragOver}
//               onDrop={(e) => onDrop(e, todo.id)}
//               onTouchStart={(e) => onTouchStart(e, todo.id)}
//               onTouchMove={onTouchMove}
//               onTouchEnd={onTouchEnd}
//               className="flex items-center bg-white border-gray-500 border-2 md:border-3 mb-1 md:mb-2 rounded w-full text-sm cursor-move touch-none select-none shadow-[0_4px_8px_rgba(0,0,0,0.3)]"
//             >
//               <div className="p-1 md:p-2">
//                 <TbArrowsUpDown className="w-5 h-5 cursor-grab" />
//               </div>
//               <div className="w-full">{todo.title}</div>
//               <div className="flex p-1 md:p-1 items-center justify-end">
//                 <UpdateInvoiceTodo id={todo.id} />
//                 <DeleteTodo title={todo.title} />
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }
// =========================================================================
// "use client";

// import { useState } from "react";
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

// // Вспомогательная функция: находит ближайший ancestor с data-id
// function getIdFromNode(node: HTMLElement | null): string | null {
//   let el: HTMLElement | null = node;
//   while (el) {
//     const id = el.dataset?.id;
//     if (id) return id;
//     el = el.parentElement;
//   }
//   return null;
// }

// // Элемент под пальцем, игнорируя перетаскиваемый
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

//   // touch state
//   const [touchXY, setTouchXY] = useState<{ x: number; y: number } | null>(null);
//   const [dragOffset, setDragOffset] = useState<{
//     dx: number;
//     dy: number;
//   } | null>(null);
//   const [dragSize, setDragSize] = useState<{ w: number; h: number } | null>(
//     null
//   );
//   const [hoverId, setHoverId] = useState<string | null>(null);

//   // Создание тени для мыши
//   const createShadow = (e: React.DragEvent<HTMLDivElement>) => {
//     (e.currentTarget as HTMLElement).style.boxShadow =
//       "0 8px 10px rgba(0, 0, 0, 0.6)";
//   };
//   // Очистка тени для мыши
//   const clearShadow = (e: React.DragEvent<HTMLDivElement>) => {
//     (e.currentTarget as HTMLElement).style.boxShadow = "";
//   };

//   // HTML5 DnD (мышь)
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

//   // Touch DnD (мобильные)
//   const onTouchStart = (e: React.TouchEvent<HTMLDivElement>, id: string) => {
//     if (e.touches.length !== 1) return;
//     const t = e.touches[0];
//     const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

//     setDragId(id);
//     setTouchXY({ x: t.clientX, y: t.clientY });

//     // Сохраняем смещение пальца внутри карточки и размер карточки для корректного превью
//     setDragOffset({ dx: t.clientX - rect.left, dy: t.clientY - rect.top });
//     setDragSize({ w: rect.width, h: rect.height });
//   };

//   const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
//     if (!dragId) return;
//     // Блокируем скролл страницы во время перетаскивания
//     e.preventDefault();
//     const t = e.touches[0];
//     const x = t.clientX;
//     const y = t.clientY;

//     setTouchXY({ x, y });

//     // Находим id строки под пальцем
//     const el = elementFromPointIgnoringDragged(x, y, dragId);
//     const targetId = getIdFromNode(el);
//     setHoverId(targetId);
//   };

//   const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
//     if (!dragId) {
//       setTouchXY(null);
//       setDragOffset(null);
//       setDragSize(null);
//       setHoverId(null);
//       return;
//     }

//     let targetId = hoverId;

//     // Fallback: если hoverId нет (например отпустили сразу), получаем из точки отпускания
//     if (!targetId && touchXY) {
//       const el = elementFromPointIgnoringDragged(touchXY.x, touchXY.y, dragId);
//       targetId = getIdFromNode(el);
//     }

//     if (targetId) {
//       const from = todos.findIndex((t) => t.id === dragId);
//       const to = todos.findIndex((t) => t.id === targetId);
//       setTodos((prev) => move(prev, from, to));
//     }

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
//             const isDragging = dragId === todo.id; // скрываем оригинал, когда тащим (его место остаётся)
//             const isHover = hoverId === todo.id && !isDragging; // подсветка цели под пальцем

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
//                   // Базовая тень
//                   "shadow-[0_4px_8px_rgba(0,0,0,0.3)]",
//                   // Скрываем (делаем невидимой) оригинальную карточку, пока перетаскиваем
//                   isDragging ? "opacity-0" : "",
//                   // Подсветка цели под пальцем во время touch DnD
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

//       {/* Превью перетаскиваемого элемента под пальцем (для touch) */}
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
//               // Выраженная тень и подсветка, как при hover
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
//               {/* Не будет кликабельно из-за pointer-events: none на враппере */}
//               <UpdateInvoiceTodo id={draggingTodo.id} />
//               <DeleteTodo title={draggingTodo.title} />
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
// =========================================================================
"use client";

import { useState, useRef } from "react";
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

  // ==== МЫШЬ (HTML5 DnD) ====
  const createShadow = (e: React.DragEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLElement).style.boxShadow =
      "0 8px 10px rgba(0,0,0,0.6)";
  };
  const clearShadow = (e: React.DragEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLElement).style.boxShadow = "";
  };

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

  // ==== TOUCH DnD ====
  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>, id: string) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

    setDragId(id);
    setTouchXY({ x: t.clientX, y: t.clientY });
    setDragOffset({ dx: t.clientX - rect.left, dy: t.clientY - rect.top });
    setDragSize({ w: rect.width, h: rect.height });
    setHoverId(id);
  };

  const autoScrollIfNearEdge = (y: number) => {
    const now = performance.now();
    if (now - lastAutoScroll.current < 16) return; // ~60fps
    const margin = 60; // зона у краёв
    const speed = 14; // px за тик

    const vh = window.innerHeight;
    if (y < margin) {
      window.scrollBy(0, -speed);
      lastAutoScroll.current = now;
    } else if (y > vh - margin) {
      window.scrollBy(0, speed);
      lastAutoScroll.current = now;
    }
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!dragId) return;
    e.preventDefault();

    const t = e.touches[0];
    const x = t.clientX;
    const y = t.clientY;
    setTouchXY({ x, y });

    autoScrollIfNearEdge(y);

    // Находим элемент/строку под пальцем
    const el = elementFromPointIgnoringDragged(x, y, dragId);
    const targetId = getIdFromNode(el);

    // Подсветка
    setHoverId(targetId ?? null);

    // Динамическая перестановка
    if (targetId && targetId !== dragId) {
      setTodos((prev) => {
        const from = prev.findIndex((t) => t.id === dragId);
        const to = prev.findIndex((t) => t.id === targetId);
        return move(prev, from, to);
      });
    }
  };

  const onTouchEnd = () => {
    // Ничего дополнительно делать не нужно, порядок уже переставлен на лету.
    setDragId(null);
    setTouchXY(null);
    setDragOffset(null);
    setDragSize(null);
    setHoverId(null);
  };

  const draggingTodo = dragId ? todos.find((t) => t.id === dragId) : null;

  return (
    <div className="flow-root">
      <div className="min-w-full text-gray-900">
        <div className="bg-amber-100">
          {todos.map((todo) => {
            const isDragging = dragId === todo.id;
            const isHover = hoverId === todo.id && !isDragging;

            return (
              <div
                key={todo.id}
                data-id={todo.id}
                draggable
                onDragStart={(e) => onDragStart(e, todo.id)}
                onDragLeave={clearShadow}
                onDragEnd={clearShadow}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, todo.id)}
                onTouchStart={(e) => onTouchStart(e, todo.id)}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                className={[
                  "flex items-center bg-white border-gray-500 border-2 md:border-3 mb-1 md:mb-2 rounded w-full text-sm cursor-move touch-none select-none transition-shadow",
                  "shadow-[0_4px_8px_rgba(0,0,0,0.3)]",
                  isDragging ? "opacity-0" : "",
                  isHover
                    ? "ring-2 ring-amber-400 shadow-[0_8px_10px_rgba(0,0,0,0.6)]"
                    : "",
                ].join(" ")}
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
            );
          })}
        </div>
      </div>

      {/* Превью перетаскиваемого элемента под пальцем */}
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
