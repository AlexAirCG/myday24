// "use client";
// import { updateTodo } from "@/app/lib/actions";
// import { Todo } from "@/app/lib/definitions";
// import { SunIcon } from "@heroicons/react/16/solid";
// import React from "react";
// import { useEffect, useState } from "react";

// export default function EditTodo1({ title, id }: { title: string; id: string }) {
//   // const [inputValue, setInputValue] = useState(title);
//   const [inputValue, setInputValue] = React.useState(title); // или null

//   // Обновляем состояние, если пропс title изменится
//   useEffect(() => {
//     setInputValue(title);
//   }, [title]);

//   const updateTodoWithId = updateTodo.bind(null, inputValue);

//   return (
//     <div className="">
//       <form action={updateTodoWithId} className="flex gap-2 mb-4">
//         <input
//           // value={inputValue}
//           value={inputValue ?? ""} // если есть вероятность, что inputValue null или undefined
//           onChange={(e) => setInputValue(e.target.value)}
//           id="id"
//           name="title"
//           type="text"
//         />
//         <button
//           type="submit"
//           className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
//         >
//           Добавить
//         </button>
//       </form>
//     </div>
//   );
// }

// export default function EditBaty({ title, id }: { title: Todo; id: string }) {
//   const updateTodoWithId = updateTodo.bind(null, title.id);
//   return (
//     <form action={updateTodoWithId}>
//       <div className="rounded-md bg-gray-50 p-4 md:p-6">
//         {/* Invoice Amount */}
//         <div className="mb-4">
//           <label htmlFor="amount" className="mb-2 block text-sm font-medium">
//             Choose an amount
//           </label>
//           <div className="relative mt-2 rounded-md">
//             <div className="relative">
//               <input
//                 id="id"
//                 name="title"
//                 type="text"
//                 defaultValue={title.title}
//                 className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
//               />
//               <button
//                 type="submit"
//                 className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
//               >
//                 Добавить
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </form>
//   );
// }
"use client";

import { Todo } from "@/app/lib/definitions";
import Link from "next/link";

import { updateTodo } from "@/app/lib/actions";
import { Button } from "../button";

export default function EditTodo({ title }: { title: Todo }) {
  const updateTodoWithId = updateTodo.bind(null, title.id);
  return (
    <form action={updateTodoWithId}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        {/* Invoice Amount */}
        <div className="mb-4">
          <label htmlFor="amount" className="mb-2 block text-sm font-medium">
            Choose an amount
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <input
                id="id"
                name="title"
                type="text"
                defaultValue={title.title}
                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/todo"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </Link>
        <Button type="submit">Edit Invoice</Button>
      </div>
    </form>
  );
}
