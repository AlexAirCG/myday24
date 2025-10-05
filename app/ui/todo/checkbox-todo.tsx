import { GiCheckMark } from "react-icons/gi";

export function CheckboxTodo() {
  return (
    <form className="flex items-center">
      <button className="p-1 mr-1 border-gray-500 border-2 rounded hover:border-green-700 cursor-pointer">
        <GiCheckMark className="w-5 h-5 hover:text-green-700" />
      </button>
    </form>
  );
}
