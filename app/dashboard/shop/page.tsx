"use client";
import styles from "@/app/ui/shop.module.css";
import { useEffect } from "react";

export default function Page() {
  // // Здесь доступен window и document
  // useEffect(() => {
  //   const tasksListElement = document.querySelector(".tasks__list");
  //   const taskElements = tasksListElement?.querySelectorAll(".tasks_item");
  //   if (taskElements) {
  //     for (const task of taskElements) {
  //       (task as HTMLElement).setAttribute("draggable", "true");
  //     }
  //   }
  //   // Начало перетаскивания
  //   tasksListElement?.addEventListener("dragstart", (evt) => {
  //     if (evt.target && evt.target instanceof HTMLElement) {
  //       evt.target.classList.add("selected");
  //     }
  //   });

  //   tasksListElement?.addEventListener("dragend", (evt) => {
  //     if (evt.target && evt.target instanceof HTMLElement) {
  //       evt.target.classList.remove("selected");
  //     }
  //   });

  //   tasksListElement?.addEventListener("dragover", (evt) => {
  //     // Разрешаем сбрасывать элементы в эту область
  //     evt.preventDefault();
  //     // Находим перемещаемый элемент
  //     const activeElement = tasksListElement.querySelector(".selected");
  //     // Находим элемент, над которым в данный момент находится курсор
  //     const currentElement = evt.target;
  //     if (!(currentElement instanceof HTMLElement)) return;
  //     if (!(activeElement instanceof HTMLElement)) return;
  //     // Проверяем, что событие сработало:
  //     // 1. не на том элементе, который мы перемещаем,
  //     // 2. именно на элементе списка
  //     const isMoveable =
  //       activeElement !== currentElement &&
  //       currentElement.classList.contains("tasks__item");
  //     // Если нет, прерываем выполнение функции
  //     if (!isMoveable) {
  //       return;
  //     }
  //     // Находим элемент, перед которым будем вставлять
  //     const nextElement =
  //       currentElement === activeElement?.nextElementSibling
  //         ? currentElement.nextElementSibling
  //         : currentElement;

  //     if (activeElement) {
  //       tasksListElement.insertBefore(activeElement, nextElement);
  //     }
  //   });
  // }, []);
  // =========================
  useEffect(() => {
    const list = document.querySelector(".tasks__list");
    if (!list) return;

    const items = list.querySelectorAll(".tasks_item");
    // Устанавливаем атрибут draggable
    items.forEach((item) => {
      (item as HTMLElement).setAttribute("draggable", "true");
    });

    // Обработчик dragstart
    list.addEventListener("dragstart", (evt) => {
      const dragEvent = evt as DragEvent; // явное приведение типа
      if (dragEvent.target && dragEvent.target instanceof HTMLElement) {
        dragEvent.target.classList.add("selected");
        dragEvent.dataTransfer?.setData("text/plain", "");
      }
    });

    // Обработчик dragend
    list.addEventListener("dragend", (evt) => {
      const dragEvent = evt as DragEvent; // явное приведение типа
      if (dragEvent.target && dragEvent.target instanceof HTMLElement) {
        dragEvent.target.classList.remove("dragging");
      }
    });

    // Обработка перетаскивания
    list.addEventListener("dragover", (evt) => {
      const dragEvent = evt as DragEvent; // явное приведение типа
      dragEvent.preventDefault();

      const afterElement = getDragAfterElement(list, dragEvent.clientY);
      const dragging = document.querySelector(".dragging");
      if (!dragging) return;

      if (afterElement == null) {
        list.appendChild(dragging);
      } else {
        list.insertBefore(dragging, afterElement);
      }
    });

    // Функция для определения, перед каким элементом вставлять
    function getDragAfterElement(container: Element, y: number) {
      const draggableElements = [
        ...container.querySelectorAll(".tasks_item:not(.dragging)"),
      ];

      return draggableElements.reduce(
        (closest, child) => {
          const box = (child as HTMLElement).getBoundingClientRect();
          const offset = y - box.top - box.height / 2;
          if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
          } else {
            return closest;
          }
        },
        { offset: Number.NEGATIVE_INFINITY, element: null as Element | null }
      ).element;
    }
  }, []);

  return (
    <section className={`tasks ${styles.tasks}`}>
      <h1 className={`tasks__title ${styles.tasks__title} pt-4`}>To do list</h1>

      <div className="flex w-full justify-center items-center pb-4">
        <ul className={`tasks__list ${styles.tasks__list}`}>
          <li className={`tasks_item ${styles.tasks__item}`}>learn HTML</li>
          <li className={`tasks_item ${styles.tasks__item}`}>learn CSS</li>
          <li className={`tasks_item ${styles.tasks__item}`}>
            learn JavaScript
          </li>
          <li className={`tasks_item ${styles.tasks__item}`}>learn PHP</li>
          <li className={`tasks_item ${styles.tasks__item}`}>stay alive</li>
        </ul>
      </div>
    </section>
  );
}
