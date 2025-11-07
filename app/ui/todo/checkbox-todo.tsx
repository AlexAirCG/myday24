import React from "react";
import { GiCheckMark } from "react-icons/gi";

type Props = {
  id: string;
  completed: boolean;
  onToggle?: (next: boolean) => void;
};

export const CheckboxTodo = React.memo(function CheckboxTodo({
  id,
  completed,
  onToggle,
}: Props) {
  const handleClick = React.useCallback(() => {
    onToggle?.(!completed);
  }, [completed, onToggle]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`p-1 m-1 border-2 rounded cursor-pointer transition-colors duration-150 ease-out ${
        completed
          ? "border-green-700 bg-green-50"
          : "border-gray-500 hover:border-green-700"
      }`}
      aria-pressed={completed}
      disabled={false} // Можно добавить disabled во время pending
    >
      <GiCheckMark
        className={`w-5 h-5 ${
          completed ? "text-green-700" : "hover:text-green-700"
        }`}
      />
    </button>
  );
});
