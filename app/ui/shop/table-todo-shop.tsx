"use client";

import { useEffect, useRef, useState } from "react";
import { DeleteTodo, UpdateInvoiceTodo } from "../todo/buttons";
import { TbArrowsUpDown } from "react-icons/tb";
import { CheckboxTodo } from "../todo/checkbox-todo";
import CreateTodo from "../todo/create-todo";

interface Todo {
  id: string;
  title: string;
  completed: boolean;
}
interface Props {
  todos: Todo[];
}

// move: Функция для перемещения элемента в массиве. Она копирует исходный массив, удаляет элемент по индексу from и вставляет его на новый индекс to.
function move<T>(arr: T[], from: number, to: number) {
  if (from === -1 || to === -1 || from === to) return arr;
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

// функция получает элемент на экране по координатам, игнорируя тот, который перетаскивается. Это
// позволяет избежать выбора самого перетаскиваемого элемента.
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

// функция возвращает ближайший элемент, который может прокручиваться в контейнере. Это нужно для того, чтобы при перетаскивании автоматически прокручивать список, если курсор находится близко к краю экрана.
function getScrollParent(el: HTMLElement | null): HTMLElement {
  let node: HTMLElement | null = el;
  while (node && node !== document.body) {
    const style = getComputedStyle(node);
    const overflowY = style.overflowY;
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      node.scrollHeight > node.clientHeight
    ) {
      return node;
    }
    node = node.parentElement;
  }
  // fallback — страница
  return (document.scrollingElement as HTMLElement) || document.documentElement;
}

export default function TableTodoShop({ todos }: Props) {
  // Состояние для списка задач.
  const [list, setList] = useState<Todo[]>(todos);

  // хранить снимок для отката
  const snapshotRef = useRef<Todo[] | null>(null);

  // подсветка последней задачи
  const prevIdsRef = useRef<Set<string>>(new Set(todos.map((t) => t.id)));
  const lastCreatedIdRef = useRef<string | null>(null);

  function flashRow(el: HTMLElement) {
    el.classList.add("ring-2", "ring-emerald-400", "animate-pulse");
    setTimeout(() => {
      el.classList.remove("ring-2", "ring-emerald-400", "animate-pulse");
    }, 1200);
  }

  // скролл последней задачи
  useEffect(() => {
    // находим новый id (которого раньше не было)
    const prev = prevIdsRef.current;
    const nextSet = new Set(todos.map((t) => t.id));
    let newId: string | null = null;
    for (const t of todos) {
      if (!prev.has(t.id)) {
        newId = t.id;
        break;
      }
    }
    prevIdsRef.current = nextSet;

    // обновляем локальный список
    setList(todos);

    // если появился новый todo — скроллим к нему после монтирования
    if (newId) {
      lastCreatedIdRef.current = newId;
      // ждём кадр, чтобы DOM успел отрендериться
      requestAnimationFrame(() => {
        const el = document.querySelector<HTMLElement>(`[data-id="${newId}"]`);
        if (el) {
          // прокрутка к элементу; родитель сам выберется (страница или скролл-контейнер)
          el.scrollIntoView({ block: "nearest", behavior: "smooth" });
          flashRow(el);
        } else {
          // запасной вариант — прокрутка в самый низ видимого контейнера
          const container = containerRef.current;
          if (container) container.scrollTop = container.scrollHeight;
        }
      });
    }
  }, [todos]);

  // СИНХРОНИЗАЦИЯ: когда пропсы меняются — обновляем локальный список
  useEffect(() => {
    setList(todos);
  }, [todos]);

  // DnD state
  // Идентификатор текущей перетаскиваемой задачи.
  const [dragId, setDragId] = useState<string | null>(null);
  // Идентификатор задачи, на которую наведена перетаскиваемая.
  const [hoverId, setHoverId] = useState<string | null>(null);

  // Touch preview state
  // Координаты касания для мобильных устройств.
  const [touchXY, setTouchXY] = useState<{ x: number; y: number } | null>(null);
  // Смещение курсора относительно элемента.
  const [dragOffset, setDragOffset] = useState<{
    dx: number;
    dy: number;
  } | null>(null);
  // Размеры перетаскиваемого элемента.
  const [dragSize, setDragSize] = useState<{ w: number; h: number } | null>(
    null
  );

  // Обработчик для события перетаскивания с помощью мыши. Он предотвращает стандартное поведение и обновляет состояние списка задач, чтобы переместить задачу.
  const onMouseDragOverCapture = (e: React.DragEvent<HTMLDivElement>) => {
    if (!dragId) return;
    e.preventDefault();

    const x = e.clientX;
    const y = e.clientY;

    const scrollEl = getScrollParent(containerRef.current);
    autoScrollIfNearEdgeXY(scrollEl, x, y);

    const el = elementFromPointIgnoringDragged(x, y, dragId);
    const row = el ? (el.closest("[data-id]") as HTMLElement | null) : null;

    if (!row) {
      setHoverId(null);
      if (e.dataTransfer) e.dataTransfer.dropEffect = "none";
      return;
    }

    const targetId = row.dataset.id!;
    setHoverId(targetId);

    setList((prev) => {
      const from = prev.findIndex((t) => t.id === dragId);
      const to = prev.findIndex((t) => t.id === targetId);
      if (from === -1 || to === -1) return prev;

      const rect = row.getBoundingClientRect();
      const overBottomHalf = y - rect.top > rect.height / 2;

      // Вставка: выше цели (верхняя половина) или ниже цели (нижняя половина)
      let insertIndex = to + (overBottomHalf ? 1 : 0);

      // Если мы вырезаем элемент до точки вставки, индекс смещается на -1
      if (from < insertIndex) insertIndex -= 1;

      if (insertIndex === from) return prev;
      return move(prev, from, insertIndex);
    });

    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  };

  // Функции автоскроллинга
  const lastAutoScroll = useRef<number>(0);
  function autoScrollIfNearEdgeXY(
    container: HTMLElement,
    x: number,
    y: number
  ) {
    const now = performance.now();
    if (now - lastAutoScroll.current < 16) return; // ~60fps

    const margin = 150; // "чувствительная зона" возле краёв
    const speed = 50; // пикселей за тик

    const rect = container.getBoundingClientRect();

    // Вертикальный скролл
    if (y < rect.top + margin) {
      container.scrollTop -= speed;
      lastAutoScroll.current = now;
    } else if (y > rect.bottom - margin) {
      container.scrollTop += speed;
      lastAutoScroll.current = now;
    }
  }

  // Унифицируем коммит порядка (и откат при ошибке)
  async function persistOrderAndCleanup() {
    try {
      const res = await fetch("/api/todos/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: list.map((t) => t.id) }),
      });
      if (!res.ok) {
        throw new Error("Failed to reorder");
      }

      snapshotRef.current = null;
    } catch (err) {
      if (snapshotRef.current) setList(snapshotRef.current);
    } finally {
      setHoverId(null);
      setDragId(null);
      setTouchXY(null);
      setDragOffset(null);
      setDragSize(null);
      if (dragImageRef.current) {
        dragImageRef.current.remove();
        dragImageRef.current = null;
      }
    }
  }

  // ==== МЫШЬ (HTML5 DnD) ==== (стартуем ТОЛЬКО с ручки)
  // Создаёт теневой эффект для элемента, когда начинается перетаскивание.
  const createShadow = (e: React.DragEvent<HTMLElement>) => {
    (e.currentTarget as HTMLElement).style.boxShadow =
      "0 8px 10px rgba(0,0,0,0.6)";
  };
  const clearShadow = (e: React.DragEvent<HTMLElement>) => {
    (e.currentTarget as HTMLElement).style.boxShadow = "";
  };

  // Хранилище клона для мыши
  const dragImageRef = useRef<HTMLElement | null>(null);
  // Обработчик события начала перетаскивания. Создаёт "призрак" элемента (внешний вид клонированного элемента), который будет перемещаться по экрану при перетаскивании.
  const onHandleDragStart = (
    e: React.DragEvent<HTMLButtonElement>,
    id: string
  ) => {
    // фиксируем список ДО изменений для возможного отката
    snapshotRef.current = list;

    setDragId(id);

    const row = (e.currentTarget as HTMLElement).closest(
      "[data-id]"
    ) as HTMLElement | null;

    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";

      if (row) {
        // Считаем размеры и смещения до старта
        const rect = row.getBoundingClientRect();
        const { clientX, clientY } = e;
        const offsetX = Math.max(0, clientX - rect.left);
        const offsetY = Math.max(0, clientY - rect.top);
        // Клонируем строку как «призрак»
        const clone = row.cloneNode(true) as HTMLElement;
        // ВАЖНО: фиксируем размеры клона в пикселях,
        // чтобы не сработал w-full (100%)
        Object.assign(clone.style, {
          position: "fixed",
          top: "-10000px",
          left: "-10000px",
          pointerEvents: "none",
          boxShadow: "0 12px 20px rgba(0,0,0,0.45)",
          opacity: "1",
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          boxSizing: "border-box",
        } as CSSStyleDeclaration);
        // Дополнительно (не обязательно, но безопасно):
        clone.classList.remove("w-full");
        document.body.appendChild(clone);
        dragImageRef.current = clone;
        // Подменяем стандартный ghost на наш клон
        e.dataTransfer.setDragImage(clone, offsetX, offsetY);
      } else {
        // fallback: пустая картинка
        const img = new Image();
        img.src =
          "data:image/svg+xml;charset=utf-8," +
          encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg"/>');
        e.dataTransfer.setDragImage(img, 0, 0);
      }
    }
  };

  const onRowDragEnd = async (e: React.DragEvent<HTMLDivElement>) => {
    clearShadow(e);
    await persistOrderAndCleanup();
  };

  const onRowDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    createShadow(e);
  };

  const onRowDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    clearShadow(e);
    setHoverId(null);
    setDragId(null);
  };

  // ==== TOUCH DnD (стартуем ТОЛЬКО с ручки) ====
  // Аналогичные обработчики для мобильных устройств с поддержкой касания. Обрабатывает начальную точку касания и начинает процесс перетаскивания.
  const onHandleTouchStart = (
    e: React.TouchEvent<HTMLButtonElement>,
    id: string
  ) => {
    if (e.touches.length !== 1) return;

    // фиксируем список ДО изменений для возможного отката
    snapshotRef.current = list;

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

  // глобальные обработчики touch-перетаскивания во время активного dnd
  const containerRef = useRef<HTMLDivElement | null>(null);

  const onTouchMoveCapture = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!dragId) return;
    e.preventDefault();

    const t = e.touches[0];
    const x = t.clientX;
    const y = t.clientY;
    setTouchXY({ x, y });

    // autoScrollIfNearEdge(y);
    // >>> автоскроллим именно скролл-контейнер (родителя), а не окно
    const scrollEl = getScrollParent(containerRef.current as HTMLElement);
    autoScrollIfNearEdgeXY(scrollEl, x, y);

    const el = elementFromPointIgnoringDragged(x, y, dragId);
    const row = el ? (el.closest("[data-id]") as HTMLElement | null) : null;

    if (!row) {
      setHoverId(null);
      return;
    }

    const targetId = row.dataset.id!;
    setHoverId(targetId);

    setList((prev) => {
      const from = prev.findIndex((tt) => tt.id === dragId);
      const to = prev.findIndex((tt) => tt.id === targetId);
      if (from === -1 || to === -1) return prev;

      const rect = row.getBoundingClientRect();
      const overBottomHalf = y - rect.top > rect.height / 2;

      let insertIndex = to + (overBottomHalf ? 1 : 0);
      if (from < insertIndex) insertIndex -= 1;

      if (insertIndex === from) return prev;
      return move(prev, from, insertIndex);
    });
  };

  const onTouchEndCapture = async () => {
    if (!dragId) return;
    await persistOrderAndCleanup();
  };

  //  touchcancel — иногда система отменяет жест
  const onTouchCancelCapture = async () => {
    if (!dragId) return;
    await persistOrderAndCleanup();
  };

  const draggingTodo = dragId ? list.find((t) => t.id === dragId) : null;

  return (
    <div className="flow-root">
      <div className="min-w-full text-gray-900">
        {/* <CreateTodo /> */}
        <div className="bg-amber-100" ref={containerRef}>
          {list.map((todo) => {
            const isDragging = dragId === todo.id;
            return (
              <div
                key={todo.id}
                data-id={todo.id}
                // ВАЖНО: строка НЕ draggable
                onDragOver={onRowDragOver}
                onDragLeave={clearShadow}
                onDragEnd={onRowDragEnd}
                onDrop={onRowDrop}
                onTouchMoveCapture={onTouchMoveCapture}
                onTouchEndCapture={onTouchEndCapture}
                onTouchCancelCapture={onTouchCancelCapture}
                onDragOverCapture={onMouseDragOverCapture}
                // ВАЖНО: убрали overflowY: "auto"
                style={{ touchAction: "pan-y" }} // overflowY по месту
                className={[
                  `flex items-center bg-white border-gray-500 border-2 md:border-3 mb-1 md:mb-2 rounded w-full text-sm select-none transition-shadow shadow-[0_4px_8px_rgba(0,0,0,0.3)]
                  ${todo.completed ? "opacity-40" : ""}`,
                  isDragging ? "opacity-0" : "",
                ].join(" ")}
              >
                {/* Ручка DnD: ТОЛЬКО тут можно начать перетаскивать */}
                <button
                  type="button"
                  aria-label="Перетащить"
                  className="p-1 cursor-grab active:cursor-grabbing touch-none border-gray-500 border-2 rounded hover:border-gray-800 m-1"
                  draggable
                  onDragStart={(e) => onHandleDragStart(e, todo.id)}
                  onTouchStart={(e) => onHandleTouchStart(e, todo.id)}
                >
                  <TbArrowsUpDown className="w-5 h-5 " />
                </button>

                <div
                  className={`w-full ml-2 select-text ${
                    todo.completed ? "line-through text-gray-400" : ""
                  }`}
                >
                  {todo.title}
                </div>

                <div className="flex p-1 md:p-1 items-center justify-end">
                  <CheckboxTodo id={todo.id} completed={todo.completed} />
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
