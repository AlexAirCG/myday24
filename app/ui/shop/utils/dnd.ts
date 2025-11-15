import { useRef } from "react";

// move: Функция для перемещения элемента в массиве. Она копирует исходный массив, удаляет элемент по индексу from и вставляет его на новый индекс to.
export function move<T>(arr: T[], from: number, to: number) {
  if (from === -1 || to === -1 || from === to) return arr;
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

// функция получает элемент на экране по координатам, игнорируя тот, который перетаскивается. Это
// позволяет избежать выбора самого перетаскиваемого элемента.
export function elementFromPointIgnoringDragged(
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
export function getScrollParent(el: HTMLElement | null): HTMLElement {
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
