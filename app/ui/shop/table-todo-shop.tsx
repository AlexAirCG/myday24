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

  const sortCard = (a: Todo, b: Todo) => {
    if (a.id > b.id) {
      return 1;
    } else {
      return -1;
    }
  };

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
