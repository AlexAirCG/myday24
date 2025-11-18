"use client";

import {
  useActionState,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { DeleteTodo } from "../todo/buttons";
import { TbArrowsUpDown } from "react-icons/tb";
import { CheckboxTodo } from "../todo/checkbox-todo";
import { toggleTodo } from "@/app/lib/actions";
import {
  elementFromPointIgnoringDragged,
  getScrollParent,
  move,
} from "./utils/dnd";
import { updateTodoInline, type UpdateState } from "@/app/lib/actions";

interface Todo {
  id: string;
  title: string;
  completed: boolean;
}
interface Props {
  todos: Todo[];
}

export default function TableTodoShop({ todos }: Props) {
  const [list, setList] = useState<Todo[]>(todos);

  // Идентификатор текущей перетаскиваемой задачи.
  const [dragId, setDragId] = useState<string | null>(null);
  // Идентификатор задачи, на которую наведена перетаскиваемая.
  const [hoverId, setHoverId] = useState<string | null>(null);
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
  const [pendingToggles, setPendingToggles] = useState<Set<string>>(new Set());

  // редактирование
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState<string>("");
  const [updateState, updateAction] = useActionState<UpdateState, FormData>(
    updateTodoInline,
    { ok: true }
  );
  const inputRef = useRef<HTMLInputElement | null>(null);
  const mouseDownRef = useRef(false);

  useEffect(() => {
    if (!editingId) return;
    // Дадим полю смонтироваться
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus({ preventScroll: true });
      // Если фокус не от мыши — ставим курсор в конец
      if (!mouseDownRef.current) {
        const len = el.value.length;
        el.setSelectionRange(len, len);
      }
      // Сброс флага
      mouseDownRef.current = false;
    });
  }, [editingId]);

  // анимация улетания невыполненной задачи
  const [animatingDown, setAnimatingDown] = useState<Set<string>>(new Set());
  // анимация улетания выполненной задачи
  const [animatingUp, setAnimatingUp] = useState<Set<string>>(new Set());

  //фильтрация (использует list)
  const incompleteTodos = list.filter((t) => !t.completed);
  const completedTodos = list.filter((t) => t.completed);

  // Все useRef
  const snapshotRef = useRef<Todo[] | null>(null);
  const deleteSnapshotRef = useRef<Todo[] | null>(null);
  const prevIdsRef = useRef<Set<string>>(new Set(todos.map((t) => t.id)));
  const lastCreatedIdRef = useRef<string | null>(null);
  // глобальные обработчики touch-перетаскивания во время активного dnd
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Отслеживание pending toggle операций
  // Хранилище клона для мыши
  const dragImageRef = useRef<HTMLElement | null>(null);
  const lastAutoScroll = useRef<number>(0);

  // ✅ 4. Функции-хелпер
  function flashRow(el: HTMLElement) {
    el.classList.add("ring-2", "ring-emerald-400", "animate-pulse");
    setTimeout(() => {
      el.classList.remove("ring-2", "ring-emerald-400", "animate-pulse");
    }, 500);
  }

  async function handleToggleOptimistic(id: string, next: boolean) {
    if (pendingToggles.has(id)) {
      console.warn(`Toggle already pending for ${id}`);
      return;
    }

    setPendingToggles((prev) => new Set(prev).add(id));

    if (next) {
      // Задача становится выполненной - анимация вниз
      setAnimatingDown((prev) => new Set(prev).add(id));

      setTimeout(() => {
        setList((prev) =>
          prev.map((t) => (t.id === id ? { ...t, completed: next } : t))
        );

        setTimeout(() => {
          setAnimatingDown((prev) => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
          });
        }, 50);
      }, 300);
    } else {
      // Задача становится невыполненной - анимация вверх + перенос в самый верх локально
      setAnimatingUp((prev) => new Set(prev).add(id));

      setTimeout(() => {
        setList((prev) => {
          const from = prev.findIndex((t) => t.id === id);
          if (from === -1) return prev;

          // обновляем completed=false и переносим на индекс 0
          const updated = { ...prev[from], completed: false };
          const copy = [...prev];
          copy.splice(from, 1);
          copy.splice(0, 0, updated);
          return copy;
        });

        setTimeout(() => {
          setAnimatingUp((prev) => {
            const nextSet = new Set(prev);
            nextSet.delete(id);
            return nextSet;
          });
        }, 50);
      }, 300);
    }

    try {
      await toggleTodo(id);

      setTimeout(() => {
        setPendingToggles((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }, 150);
    } catch (e) {
      console.error("Toggle failed:", e);
      setList((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !next } : t))
      );
      setPendingToggles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      // Убираем анимацию при ошибке
      setAnimatingDown((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      setAnimatingUp((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  }

  useEffect(() => {
    if (dragId) return;

    const prev = prevIdsRef.current;
    const nextSet = new Set(todos.map((t) => t.id));
    const newTodo = todos.find((t) => !prev.has(t.id)) || null;

    prevIdsRef.current = nextSet;

    setList((prevList) => {
      const hasStructuralChanges =
        todos.length !== prevList.length ||
        todos.some((t) => !prevList.find((p) => p.id === t.id)) ||
        prevList.some((p) => !todos.find((t) => t.id === p.id));

      if (hasStructuralChanges) {
        return todos.map((todo) => {
          // ✅ pendingToggles доступен через замыкание
          if (pendingToggles.has(todo.id)) {
            const pendingTodo = prevList.find((t) => t.id === todo.id);
            return pendingTodo || todo;
          }
          return todo;
        });
      }

      const hasDataChanges = todos.some((todo) => {
        if (pendingToggles.has(todo.id)) return false;
        const prevTodo = prevList.find((t) => t.id === todo.id);
        return (
          prevTodo &&
          (prevTodo.completed !== todo.completed ||
            prevTodo.title !== todo.title)
        );
      });

      if (hasDataChanges) {
        return todos.map((todo) => {
          if (pendingToggles.has(todo.id)) {
            const pendingTodo = prevList.find((t) => t.id === todo.id);
            return pendingTodo || todo;
          }
          return todo;
        });
      }

      return prevList;
    });

    lastCreatedIdRef.current = newTodo?.id ?? null;
  }, [todos, dragId]);

  // 2) Скроллим ПОСЛЕ того, как DOM обновился
  useLayoutEffect(() => {
    const id = lastCreatedIdRef.current;
    if (!id) return;

    let attempts = 0;
    const tryScroll = () => {
      const el = document.querySelector<HTMLElement>(`[data-id="${id}"]`);
      if (el) {
        // block: 'end' или 'center' обычно надёжнее, чем 'nearest'
        el.scrollIntoView({
          block: "end",
          inline: "nearest",
          behavior: "smooth",
        });
        flashRow(el);
        lastCreatedIdRef.current = null;
      } else if (attempts++ < 3) {
        // Если элемент ещё не в DOM, подождём 1–2 кадра
        requestAnimationFrame(tryScroll);
      } else {
        // Фоллбек — прокрутить в самый низ скролл-контейнер/страницу
        const scrollEl = getScrollParent(containerRef.current);
        if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight;
        lastCreatedIdRef.current = null;
      }
    };

    // Ждём кадр после коммита и пробуем
    requestAnimationFrame(tryScroll);
  }, [list.length]);

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
  function autoScrollIfNearEdgeXY(
    container: HTMLElement,
    x: number,
    y: number
  ) {
    const now = performance.now();
    if (now - lastAutoScroll.current < 16) return; // ~60fps

    const margin = 60; // "чувствительная зона" возле краёв
    const speed = 14; // пикселей за тик

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

  // оптимистическое удаление
  function handleDeleteOptimistic(id: string) {
    deleteSnapshotRef.current = list;
    setList((prev) => prev.filter((t) => t.id !== id));
  }
  function revertDelete() {
    if (deleteSnapshotRef.current) {
      setList(deleteSnapshotRef.current);
      deleteSnapshotRef.current = null;
    }
  }

  return (
    <div className="flow-root">
      <div className="min-w-full text-gray-900">
        <div
          className="bg-sky-200"
          ref={containerRef}
          onTouchMoveCapture={onTouchMoveCapture}
          onTouchEndCapture={onTouchEndCapture}
          onTouchCancelCapture={onTouchCancelCapture}
          onDragOverCapture={onMouseDragOverCapture}
        >
          {/* Невыполненные задачи */}
          {incompleteTodos.map((todo) => {
            const isDragging = dragId === todo.id;
            const isAnimatingDown = animatingDown.has(todo.id);
            return (
              <div
                key={todo.id}
                data-id={todo.id}
                onDragOver={onRowDragOver}
                onDragLeave={clearShadow}
                onDragEnd={onRowDragEnd}
                onDrop={onRowDrop}
                style={{ touchAction: "pan-y" }} // overflowY по месту
                className={[
                  `flex items-center bg-white border-gray-500 border-2 md:border-3 mb-1 md:mb-2 rounded w-full text-lg select-none transition-shadow shadow-[0_4px_8px_rgba(0,0,0,0.3)]
                  ${todo.completed ? "opacity-40" : ""}`,
                  isDragging ? "opacity-0" : "",
                  isAnimatingDown ? "animate-slide-down-fade" : "",
                ].join(" ")}
              >
                <CheckboxTodo
                  id={todo.id}
                  completed={todo.completed}
                  onToggle={(next) => handleToggleOptimistic(todo.id, next)}
                />

                {editingId === todo.id ? (
                  <form
                    className="w-full ml-2"
                    action={updateAction}
                    onSubmitCapture={() => {
                      // оптимистично обновим локальный список и закроем инпут
                      const next = draftTitle.trim();
                      if (next && next !== todo.title) {
                        setList((prev) =>
                          prev.map((t) =>
                            t.id === todo.id ? { ...t, title: next } : t
                          )
                        );
                      }
                      setEditingId(null);
                    }}
                  >
                    <input type="hidden" name="id" value={todo.id} />
                    <input
                      ref={inputRef}
                      name="title"
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      onMouseDown={() => {
                        // Пользователь сам выберет позицию курсора – не вмешиваемся
                        mouseDownRef.current = true;
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          e.preventDefault();
                          setEditingId(null);
                          setDraftTitle("");
                        }
                        if (e.key === "Enter") {
                          if (!draftTitle.trim()) {
                            e.preventDefault();
                            return setEditingId(null);
                          }
                        }
                      }}
                      onBlur={(e) => {
                        const next = e.currentTarget.value.trim();
                        if (next && next !== todo.title) {
                          e.currentTarget.form?.requestSubmit();
                        } else {
                          setEditingId(null);
                        }
                      }}
                      className="w-full bg-transparent outline-none border-b border-gray-300 focus:border-blue-500"
                      placeholder="Название задачи"
                      autoComplete="off"
                    />
                  </form>
                ) : (
                  <div
                    className="w-full ml-2 select-text cursor-text"
                    onClick={() => {
                      // Не открываем редактирование, если идёт перетаскивание
                      if (dragId) return;
                      setEditingId(todo.id);
                      setDraftTitle(todo.title);
                    }}
                    title="Нажмите, чтобы редактировать"
                  >
                    {todo.title}
                  </div>
                )}

                <div className="flex p-1 md:p-1 items-center justify-center gap-1">
                  <DeleteTodo
                    id={todo.id}
                    onOptimisticDelete={() => handleDeleteOptimistic(todo.id)}
                    onRevert={revertDelete}
                  />
                  {/* Ручка DnD: ТОЛЬКО тут можно начать перетаскивать */}
                  <button
                    type="button"
                    aria-label="Перетащить"
                    className="p-1 cursor-grab active:cursor-grabbing touch-none border-gray-500 border-2 rounded hover:border-gray-800"
                    draggable
                    onDragStart={(e) => onHandleDragStart(e, todo.id)}
                    onTouchStart={(e) => onHandleTouchStart(e, todo.id)}
                  >
                    <TbArrowsUpDown className="w-5 h-5 " />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Разделитель (если есть обе группы) */}
          {incompleteTodos.length > 0 && completedTodos.length > 0 && (
            <div className="flex items-center my-4">
              <div className="flex-grow border-t-2 border-gray-400"></div>
              <span className="px-3 text-sm text-gray-600">Выполнено</span>
              <div className="flex-grow border-t-2 border-gray-400"></div>
            </div>
          )}

          {/* Выполненные задачи */}
          {completedTodos.map((todo) => {
            const isDragging = dragId === todo.id;
            const isAnimatingUp = animatingUp.has(todo.id);
            return (
              <div
                key={todo.id}
                data-id={todo.id}
                onDragOver={onRowDragOver}
                onDragLeave={clearShadow}
                onDragEnd={onRowDragEnd}
                onDrop={onRowDrop}
                style={{ touchAction: "pan-y" }} // overflowY по месту
                className={[
                  `flex items-center bg-white border-gray-500 border-2 md:border-3 mb-1 md:mb-2 rounded w-full text-lg select-none transition-shadow shadow-[0_4px_8px_rgba(0,0,0,0.3)]
                  ${todo.completed ? "opacity-60" : ""}`,
                  isDragging ? "opacity-0" : "",
                  isAnimatingUp ? "animate-slide-up-fade" : "",
                ].join(" ")}
              >
                <CheckboxTodo
                  id={todo.id}
                  completed={todo.completed}
                  onToggle={(next) => handleToggleOptimistic(todo.id, next)}
                />

                {editingId === todo.id ? (
                  <form
                    className="w-full ml-2"
                    action={updateAction}
                    onSubmitCapture={() => {
                      // оптимистично обновим локальный список и закроем инпут
                      const next = draftTitle.trim();
                      if (next && next !== todo.title) {
                        setList((prev) =>
                          prev.map((t) =>
                            t.id === todo.id ? { ...t, title: next } : t
                          )
                        );
                      }
                      setEditingId(null);
                    }}
                  >
                    <input type="hidden" name="id" value={todo.id} />
                    <input
                      ref={inputRef}
                      name="title"
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          e.preventDefault();
                          setEditingId(null);
                          setDraftTitle("");
                        }
                        if (e.key === "Enter") {
                          // Пустое — не отправляем
                          if (!draftTitle.trim()) {
                            e.preventDefault();
                            return setEditingId(null);
                          }
                        }
                      }}
                      onBlur={(e) => {
                        const next = e.currentTarget.value.trim();
                        if (next && next !== todo.title) {
                          // Сохраняем при потере фокуса
                          e.currentTarget.form?.requestSubmit();
                        } else {
                          setEditingId(null);
                        }
                      }}
                      className="w-full bg-transparent outline-none border-b border-gray-300 focus:border-blue-500"
                      placeholder="Название задачи"
                      autoComplete="off"
                    />
                  </form>
                ) : (
                  <div
                    className="w-full ml-2 select-text cursor-text"
                    onClick={() => {
                      // Не открываем редактирование, если идёт перетаскивание
                      if (dragId) return;
                      setEditingId(todo.id);
                      setDraftTitle(todo.title);
                    }}
                    title="Нажмите, чтобы редактировать"
                  >
                    {todo.title}
                  </div>
                )}

                <div className="flex p-1 md:p-1 items-center justify-center gap-1">
                  <DeleteTodo
                    id={todo.id}
                    onOptimisticDelete={() => handleDeleteOptimistic(todo.id)}
                    onRevert={revertDelete}
                  />
                  {/* Ручка DnD: ТОЛЬКО тут можно начать перетаскивать */}
                  <button
                    type="button"
                    aria-label="Перетащить"
                    className="p-1 cursor-grab active:cursor-grabbing touch-none border-gray-500 border-2 rounded hover:border-gray-800"
                    draggable
                    onDragStart={(e) => onHandleDragStart(e, todo.id)}
                    onTouchStart={(e) => onHandleTouchStart(e, todo.id)}
                  >
                    <TbArrowsUpDown className="w-5 h-5 " />
                  </button>
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
            <div className="flex p-1 md:p-1 items-center justify-end"></div>
          </div>
        </div>
      )}
    </div>
  );
}
