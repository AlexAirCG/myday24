import { GiCheckMark } from "react-icons/gi";

type Props = {
  id: string;
  completed: boolean;
  onToggle?: (next: boolean) => void;
};

export function CheckboxTodo({ completed, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={() => onToggle?.(!completed)}
      className={`p-1 mr-1 border-2 rounded cursor-pointer active:bg-green-700 transition-colors duration-150 ease-out ${
        completed
          ? "border-green-700 bg-green-50"
          : "border-gray-500 hover:border-green-700"
      }`}
      aria-pressed={completed}
      aria-label={
        completed ? "Снять отметку о выполнении" : "Отметить как выполнено"
      }
      title={
        completed ? "Снять отметку о выполнении" : "Отметить как выполнено"
      }
    >
      <GiCheckMark
        className={`w-5 h-5 ${
          completed ? "text-green-700" : "hover:text-green-700"
        }`}
      />
    </button>
  );
}
