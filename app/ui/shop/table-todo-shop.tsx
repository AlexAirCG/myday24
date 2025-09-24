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

export default function TableTodoShop({ todos: initialTodos }: Props) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [currentTodo, setCurrentTodo] = useState("");

  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchMoveY, setTouchMoveY] = useState<number | null>(null);

  const dragStartHandler = (
    e: React.DragEvent<HTMLDivElement>,
    todo: string
  ) => {
    console.log("drag", todo);
    setCurrentTodo(todo);
  };

  const dragEndHabdler = (e: React.DragEvent<HTMLDivElement>) => {
    (e.target as HTMLElement).style.boxShadow = "";
  };

  const dragOverHabdler = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    (e.target as HTMLElement).style.boxShadow =
      "0 10px 20px rgba(0, 0, 0, 0.6)";
  };

  const dropHabdler = (e: React.DragEvent<HTMLDivElement>, todo: string) => {
    e.preventDefault();
    setTodos(
      todos.map((c) => {
        if (c.id === todo) {
          return { ...c, id: currentTodo };
        }
        if (c.id === currentTodo) {
          return { ...c, id: todo };
        }
        return c;
      })
    );
    (e.target as HTMLElement).style.boxShadow = "";
  };

  // Touch event handlers
  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>, todo: string) => {
    if (e.touches.length === 1) {
      setCurrentTodo(todo);
      setTouchStartY(e.touches[0].clientY);
    }
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1 && touchStartY !== null) {
      setTouchMoveY(e.touches[0].clientY);
    }
  };

  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>, todo: string) => {
    if (
      touchStartY !== null &&
      touchMoveY !== null &&
      Math.abs(touchMoveY - touchStartY) > 30 // порог срабатывания, например 30px
    ) {
      // Определяем, вверх или вниз перетаскивание
      const isDown = touchMoveY > touchStartY;

      // Находим индекс текущего элемента и элемента назначения
      const currentIndex = todos.findIndex((t) => t.id === todo);
      const targetIndex = isDown
        ? Math.min(currentIndex + 1, todos.length - 1)
        : Math.max(currentIndex - 1, 0);

      const newTodos = [...todos];
      const [movedItem] = newTodos.splice(currentIndex, 1);
      newTodos.splice(targetIndex, 0, movedItem);
      setTodos(newTodos);
    }

    // Очистка состояний
    setTouchStartY(null);
    setTouchMoveY(null);
    setCurrentTodo("");
  };

  const sortCard = (a: Todo, b: Todo) => (a.id > b.id ? 1 : -1);

  return (
    <div className="flow-root">
      <div className=" min-w-full text-gray-900">
        <div className="bg-amber-100">
          {todos.sort(sortCard).map((todo, index) => (
            <div
              key={index}
              draggable={true}
              onDragStart={(e) => dragStartHandler(e, todo.id)}
              onDragLeave={(e) => dragEndHabdler(e)}
              onDragEnd={(e) => dragEndHabdler(e)}
              onDragOver={(e) => dragOverHabdler(e)}
              onDrop={(e) => dropHabdler(e, todo.id)}
              onTouchStart={(e) => onTouchStart(e, todo.id)}
              onTouchMove={(e) => onTouchMove(e)}
              onTouchEnd={(e) => onTouchEnd(e, todo.id)}
              className="flex items-center bg-white border-gray-500 border-2 md:border-3 mb-1 md:mb-2 rounded w-full text-sm cursor-move"
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
