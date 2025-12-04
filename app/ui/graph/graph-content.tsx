"use client";
import { useMemo, useRef, useState, forwardRef, useEffect } from "react";
import DatePicker from "react-datepicker";
import { ru } from "date-fns/locale/ru";

type RawPoint = {
  id: string;
  year: number;
  month: number; // 1..12
  day: number; // 1..31 (зависит от месяца)
  calories: number; // 0..5000
};

const DAY_PIXEL_STEP = 10;
const GRAPH_HEIGHT = 300;
const GRAPH_TOP_PADDING = 10;
const GRAPH_BOTTOM_PADDING = 10;

const DEFAULT_GRAPH_WIDTH = 600;
const CALORIES_MIN = 0;
const CALORIES_MAX = 5000;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const createId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

// Количество дней в месяце
const daysInMonth = (year: number, month1to12: number) =>
  new Date(year, month1to12, 0).getDate();

// Кастомный инпут с forwardRef — нужен, чтобы управлять фокусом (blur → focus)
const DateInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className = "", ...props }, ref) => (
  <input
    {...props}
    ref={ref}
    className={
      className ||
      "mt-1 w-56 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
    }
  />
));
DateInput.displayName = "DateInput";

// вне компонента — обычная функция (без хуков)
const detectMobile = () => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const uaDataMobile = (navigator as any).userAgentData?.mobile ?? false;
  const isUAMobile =
    /Android|iPhone|iPad|iPod|IEMobile|Opera Mini|Mobile/i.test(ua);
  const hasTouch =
    "maxTouchPoints" in navigator && navigator.maxTouchPoints > 1;
  const smallViewport =
    typeof window !== "undefined" &&
    Math.min(window.innerWidth, window.innerHeight) < 768;

  return uaDataMobile || isUAMobile || (hasTouch && smallViewport);
};

// кастомный хук — можно вызывать хуки
function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    setMobile(detectMobile());
  }, []);
  return mobile;
}

export function GraphContent() {
  const isMobile = useIsMobile(); // <-- вместо useMemo на верхнем уровне

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calories, setCalories] = useState<string>("");
  const [points, setPoints] = useState<RawPoint[]>([]);
  const [error, setError] = useState<string>("");

  const [allowTyping, setAllowTyping] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const dateInputRef = useRef<HTMLInputElement | null>(null);

  // Минимальная дата среди всех точек (UTC)
  const minDateMs = useMemo(() => {
    if (!points.length) return null;
    return Math.min(...points.map((p) => Date.UTC(p.year, p.month - 1, p.day)));
  }, [points]);

  // Динамический шаг по Y (пикселей на 1 калорию)
  const caloriePixelStep = useMemo(() => {
    const drawableHeight =
      GRAPH_HEIGHT - GRAPH_TOP_PADDING - GRAPH_BOTTOM_PADDING;
    const range = Math.max(1, CALORIES_MAX - CALORIES_MIN);
    return drawableHeight / range;
  }, []);

  // Координаты и сортировка по времени (год-месяц-день)
  const pointsWithCoords = useMemo(() => {
    if (!points.length) return [];

    return points
      .map((p) => {
        const timeMs = Date.UTC(p.year, p.month - 1, p.day);
        const baseMs = minDateMs ?? timeMs;
        const daysDiff = (timeMs - baseMs) / MS_PER_DAY; // целое число

        const x = daysDiff * DAY_PIXEL_STEP;

        const y =
          GRAPH_HEIGHT -
          GRAPH_BOTTOM_PADDING -
          (p.calories - CALORIES_MIN) * caloriePixelStep;

        return { ...p, x, y };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        if (a.month !== b.month) return a.month - b.month;
        return a.day - b.day;
      });
  }, [points, minDateMs, caloriePixelStep]);

  const graphWidth = useMemo(() => {
    if (!pointsWithCoords.length) return DEFAULT_GRAPH_WIDTH;
    const last = pointsWithCoords[pointsWithCoords.length - 1];
    return Math.max(last.x + DAY_PIXEL_STEP, DEFAULT_GRAPH_WIDTH);
  }, [pointsWithCoords]);

  const handleAddPoint = () => {
    if (!selectedDate || !calories) {
      setError("Выберите дату и укажите значение.");
      return;
    }

    const yearValue = selectedDate.getFullYear();
    const monthValue = selectedDate.getMonth() + 1; // 0..11 -> 1..12
    const dayValue = selectedDate.getDate();
    const caloriesValue = Number(calories);

    if (Number.isNaN(caloriesValue)) {
      setError("Некорректный ввод калорий.");
      return;
    }

    if (monthValue < 1 || monthValue > 12) {
      setError("Некорректный месяц.");
      return;
    }

    const dim = daysInMonth(yearValue, monthValue);
    if (dayValue < 1 || dayValue > dim) {
      setError("Некорректный день месяца.");
      return;
    }

    if (caloriesValue < CALORIES_MIN || caloriesValue > CALORIES_MAX) {
      setError(
        `Значение должно быть в диапазоне ${CALORIES_MIN}-${CALORIES_MAX}.`
      );
      return;
    }

    const nextPoint: RawPoint = {
      id: createId(),
      year: yearValue,
      month: monthValue,
      day: dayValue,
      calories: caloriesValue,
    };

    setPoints((prev) => [...prev, nextPoint]);
    setError("");
    setCalories("");
    // Дату оставляем, чтобы можно было добавлять несколько точек подряд
  };

  return (
    <section className="flex w-full flex-col gap-4 rounded-xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
      <h2 className="text-xl font-semibold text-slate-800">График калорий</h2>

      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col text-sm text-slate-700">
          Дата
          <DatePicker
            selected={selectedDate}
            onChange={(d) => setSelectedDate(d)}
            placeholderText="Выберите дату"
            dateFormat="dd-MM-yyyy"
            locale={ru}
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            showPopperArrow={false}
            isClearable
            todayButton="Сегодня"
            // ВАЖНО: не задаём readOnly тут — при customInput он не попадёт в <input/>
            withPortal={isMobile} // опционально, на мобилках удобнее
            onCalendarOpen={() => setCalendarOpen(true)}
            onCalendarClose={() => {
              setCalendarOpen(false);
              setAllowTyping(false);
            }}
            onInputClick={() => {
              if (isMobile && calendarOpen && !allowTyping) {
                setAllowTyping(true);
                requestAnimationFrame(() => {
                  const el = dateInputRef.current;
                  if (!el) return;
                  el.blur();
                  setTimeout(() => el.focus(), 0);
                });
              }
            }}
            customInput={
              <DateInput
                ref={dateInputRef}
                readOnly={isMobile && !allowTyping} // <- сюда
                inputMode={isMobile && !allowTyping ? "none" : "text"} // <- и сюда
                onFocus={(e) => {
                  if (isMobile && !allowTyping) {
                    e.preventDefault();
                    e.currentTarget.blur(); // «страховка» от преждевременной клавиатуры
                  }
                }}
                className="mt-1 w-56 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            }
          />
        </label>

        <label className="flex flex-col text-sm text-slate-700">
          Потреблённые калории
          <input
            type="number"
            min={CALORIES_MIN}
            max={CALORIES_MAX}
            className="mt-1 w-48 rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder={`Введите значение (${CALORIES_MIN}-${CALORIES_MAX})`}
            value={calories}
            onChange={(event) => setCalories(event.target.value)}
          />
        </label>

        <button
          type="button"
          className="inline-flex items-center rounded-md bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus-visible:outline  focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          onClick={handleAddPoint}
        >
          Добавить
        </button>
      </div>

      {error ? (
        <p className="text-sm font-medium text-red-600">{error}</p>
      ) : null}

      <div className="relative h-[300px] w-full overflow-auto rounded-lg bg-yellow-200">
        <svg
          className="h-full"
          width={graphWidth}
          height={GRAPH_HEIGHT}
          viewBox={`0 0 ${graphWidth} ${GRAPH_HEIGHT}`}
        >
          {/* Линии */}
          {pointsWithCoords.slice(1).map((point, index) => {
            const previous = pointsWithCoords[index];
            return (
              <line
                key={`${point.id}-line`}
                x1={previous.x}
                y1={previous.y}
                x2={point.x}
                y2={point.y}
                stroke="rgb(59 130 246)"
                strokeWidth={4}
              />
            );
          })}

          {/* Точки */}
          {pointsWithCoords.map((point) => (
            <g key={point.id}>
              <circle
                cx={point.x}
                cy={point.y}
                r={4}
                fill="rgb(59 130 246)"
                strokeWidth={1.5}
              />
              <title>{`Дата: ${String(point.day).padStart(2, "0")}.${String(
                point.month
              ).padStart(2, "0")}.${point.year}, значение: ${
                point.calories
              }`}</title>
            </g>
          ))}
        </svg>
      </div>
    </section>
  );
}

// "use client";
// import { useMemo, useRef, useState, forwardRef } from "react";
// import DatePicker from "react-datepicker";
// import { ru } from "date-fns/locale/ru";

// type RawPoint = {
//   id: string;
//   year: number;
//   month: number; // 1..12
//   day: number; // 1..31 (зависит от месяца)
//   calories: number; // 0..5000
// };

// const DAY_PIXEL_STEP = 10;
// const GRAPH_HEIGHT = 300;
// const GRAPH_TOP_PADDING = 10;
// const GRAPH_BOTTOM_PADDING = 10;

// const DEFAULT_GRAPH_WIDTH = 600;
// const CALORIES_MIN = 0;
// const CALORIES_MAX = 5000;

// const MS_PER_DAY = 24 * 60 * 60 * 1000;

// const createId = () =>
//   typeof crypto !== "undefined" && crypto.randomUUID
//     ? crypto.randomUUID()
//     : Math.random().toString(36).slice(2);

// // Количество дней в месяце
// const daysInMonth = (year: number, month1to12: number) =>
//   new Date(year, month1to12, 0).getDate();

// // Кастомный инпут с forwardRef — нужен, чтобы управлять фокусом (blur → focus)
// const DateInput = forwardRef<
//   HTMLInputElement,
//   React.InputHTMLAttributes<HTMLInputElement>
// >(({ className = "", ...props }, ref) => (
//   <input
//     {...props}
//     ref={ref}
//     className={
//       className ||
//       "mt-1 w-56 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
//     }
//   />
// ));
// DateInput.displayName = "DateInput";

// export function GraphContent() {
//   const [selectedDate, setSelectedDate] = useState<Date | null>(null);
//   const [calories, setCalories] = useState<string>("");
//   const [points, setPoints] = useState<RawPoint[]>([]);
//   const [error, setError] = useState<string>("");

//   // Управление показом клавиатуры на мобильных
//   const [allowTyping, setAllowTyping] = useState(false); // можно ли печатать в поле даты
//   const [calendarOpen, setCalendarOpen] = useState(false); // открыт ли календарь
//   const dateInputRef = useRef<HTMLInputElement | null>(null);

//   // улучшенная эвристика мобильности
//   const isMobile = useMemo(() => {
//     if (typeof navigator === "undefined") return false;
//     const ua = navigator.userAgent || "";
//     const uaDataMobile = (navigator as any).userAgentData?.mobile ?? false;
//     const isUAMobile =
//       /Android|iPhone|iPad|iPod|IEMobile|Opera Mini|Mobile/i.test(ua);
//     const hasTouch =
//       "maxTouchPoints" in navigator && navigator.maxTouchPoints > 1;
//     const smallViewport =
//       typeof window !== "undefined" &&
//       Math.min(window.innerWidth, window.innerHeight) < 768;

//     return uaDataMobile || isUAMobile || (hasTouch && smallViewport);
//   }, []);

//   // Минимальная дата среди всех точек (UTC)
//   const minDateMs = useMemo(() => {
//     if (!points.length) return null;
//     return Math.min(...points.map((p) => Date.UTC(p.year, p.month - 1, p.day)));
//   }, [points]);

//   // Динамический шаг по Y (пикселей на 1 калорию)
//   const caloriePixelStep = useMemo(() => {
//     const drawableHeight =
//       GRAPH_HEIGHT - GRAPH_TOP_PADDING - GRAPH_BOTTOM_PADDING;
//     const range = Math.max(1, CALORIES_MAX - CALORIES_MIN);
//     return drawableHeight / range;
//   }, []);

//   // Координаты и сортировка по времени (год-месяц-день)
//   const pointsWithCoords = useMemo(() => {
//     if (!points.length) return [];

//     return points
//       .map((p) => {
//         const timeMs = Date.UTC(p.year, p.month - 1, p.day);
//         const baseMs = minDateMs ?? timeMs;
//         const daysDiff = (timeMs - baseMs) / MS_PER_DAY; // целое число

//         const x = daysDiff * DAY_PIXEL_STEP;

//         const y =
//           GRAPH_HEIGHT -
//           GRAPH_BOTTOM_PADDING -
//           (p.calories - CALORIES_MIN) * caloriePixelStep;

//         return { ...p, x, y };
//       })
//       .sort((a, b) => {
//         if (a.year !== b.year) return a.year - b.year;
//         if (a.month !== b.month) return a.month - b.month;
//         return a.day - b.day;
//       });
//   }, [points, minDateMs, caloriePixelStep]);

//   const graphWidth = useMemo(() => {
//     if (!pointsWithCoords.length) return DEFAULT_GRAPH_WIDTH;
//     const last = pointsWithCoords[pointsWithCoords.length - 1];
//     return Math.max(last.x + DAY_PIXEL_STEP, DEFAULT_GRAPH_WIDTH);
//   }, [pointsWithCoords]);

//   const handleAddPoint = () => {
//     if (!selectedDate || !calories) {
//       setError("Выберите дату и укажите значение.");
//       return;
//     }

//     const yearValue = selectedDate.getFullYear();
//     const monthValue = selectedDate.getMonth() + 1; // 0..11 -> 1..12
//     const dayValue = selectedDate.getDate();
//     const caloriesValue = Number(calories);

//     if (Number.isNaN(caloriesValue)) {
//       setError("Некорректный ввод калорий.");
//       return;
//     }

//     if (monthValue < 1 || monthValue > 12) {
//       setError("Некорректный месяц.");
//       return;
//     }

//     const dim = daysInMonth(yearValue, monthValue);
//     if (dayValue < 1 || dayValue > dim) {
//       setError("Некорректный день месяца.");
//       return;
//     }

//     if (caloriesValue < CALORIES_MIN || caloriesValue > CALORIES_MAX) {
//       setError(
//         `Значение должно быть в диапазоне ${CALORIES_MIN}-${CALORIES_MAX}.`
//       );
//       return;
//     }

//     const nextPoint: RawPoint = {
//       id: createId(),
//       year: yearValue,
//       month: monthValue,
//       day: dayValue,
//       calories: caloriesValue,
//     };

//     setPoints((prev) => [...prev, nextPoint]);
//     setError("");
//     setCalories("");
//     // Дату оставляем, чтобы можно было добавлять несколько точек подряд
//   };

//   return (
//     <section className="flex w-full flex-col gap-4 rounded-xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
//       <h2 className="text-xl font-semibold text-slate-800">График калорий</h2>

//       <div className="flex flex-wrap items-end gap-4">
//         <label className="flex flex-col text-sm text-slate-700">
//           Дата
//           <DatePicker
//             selected={selectedDate}
//             onChange={(d) => setSelectedDate(d)}
//             placeholderText="Выберите дату"
//             dateFormat="dd-MM-yyyy"
//             locale={ru}
//             showMonthDropdown
//             showYearDropdown
//             dropdownMode="select"
//             showPopperArrow={false}
//             isClearable
//             todayButton="Сегодня"
//             // не задаём readOnly здесь — он не дойдёт до <input/> при customInput
//             withPortal={isMobile} // опционально: удобнее на мобилках
//             onCalendarOpen={() => setCalendarOpen(true)}
//             onCalendarClose={() => {
//               setCalendarOpen(false);
//               setAllowTyping(false); // после закрытия снова запрещаем ввод
//             }}
//             onInputClick={() => {
//               // второй тап по полю при открытом календаре — разрешаем ввод и поднимаем клавиатуру
//               if (isMobile && calendarOpen && !allowTyping) {
//                 setAllowTyping(true);
//                 requestAnimationFrame(() => {
//                   const el = dateInputRef.current;
//                   if (!el) return;
//                   el.blur();
//                   setTimeout(() => el.focus(), 0);
//                 });
//               }
//             }}
//             customInput={
//               <DateInput
//                 ref={dateInputRef}
//                 // КЛЮЧЕВОЕ: readOnly и inputMode — именно на самом input
//                 readOnly={isMobile && !allowTyping}
//                 inputMode={isMobile && !allowTyping ? "none" : "text"}
//                 className="mt-1 w-56 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
//                 // Страховка от агрессивных браузеров, которые всё равно поднимают клавиатуру
//                 onFocus={(e) => {
//                   if (isMobile && !allowTyping) {
//                     e.preventDefault();
//                     e.currentTarget.blur();
//                   }
//                 }}
//               />
//             }
//           />
//         </label>

//         <label className="flex flex-col text-sm text-slate-700">
//           Потреблённые калории
//           <input
//             type="number"
//             min={CALORIES_MIN}
//             max={CALORIES_MAX}
//             className="mt-1 w-48 rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
//             placeholder={`Введите значение (${CALORIES_MIN}-${CALORIES_MAX})`}
//             value={calories}
//             onChange={(event) => setCalories(event.target.value)}
//           />
//         </label>

//         <button
//           type="button"
//           className="inline-flex items-center rounded-md bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus-visible:outline  focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
//           onClick={handleAddPoint}
//         >
//           Добавить
//         </button>
//       </div>

//       {error ? (
//         <p className="text-sm font-medium text-red-600">{error}</p>
//       ) : null}

//       <div className="relative h-[300px] w-full overflow-auto rounded-lg bg-yellow-200">
//         <svg
//           className="h-full"
//           width={graphWidth}
//           height={GRAPH_HEIGHT}
//           viewBox={`0 0 ${graphWidth} ${GRAPH_HEIGHT}`}
//         >
//           {/* Линии */}
//           {pointsWithCoords.slice(1).map((point, index) => {
//             const previous = pointsWithCoords[index];
//             return (
//               <line
//                 key={`${point.id}-line`}
//                 x1={previous.x}
//                 y1={previous.y}
//                 x2={point.x}
//                 y2={point.y}
//                 stroke="rgb(59 130 246)"
//                 strokeWidth={4}
//               />
//             );
//           })}

//           {/* Точки */}
//           {pointsWithCoords.map((point) => (
//             <g key={point.id}>
//               <circle
//                 cx={point.x}
//                 cy={point.y}
//                 r={4}
//                 fill="rgb(59 130 246)"
//                 strokeWidth={1.5}
//               />
//               <title>{`Дата: ${String(point.day).padStart(2, "0")}.${String(
//                 point.month
//               ).padStart(2, "0")}.${point.year}, значение: ${
//                 point.calories
//               }`}</title>
//             </g>
//           ))}
//         </svg>
//       </div>
//     </section>
//   );
// }

// "use client";
// import { useMemo, useRef, useState, forwardRef } from "react";
// import DatePicker from "react-datepicker";
// import { ru } from "date-fns/locale/ru";

// type RawPoint = {
//   id: string;
//   year: number;
//   month: number; // 1..12
//   day: number; // 1..31 (зависит от месяца)
//   calories: number; // 0..5000
// };

// const DAY_PIXEL_STEP = 10;
// const GRAPH_HEIGHT = 300;
// const GRAPH_TOP_PADDING = 10;
// const GRAPH_BOTTOM_PADDING = 10;

// const DEFAULT_GRAPH_WIDTH = 600;
// const CALORIES_MIN = 0;
// const CALORIES_MAX = 5000;

// const MS_PER_DAY = 24 * 60 * 60 * 1000;

// const createId = () =>
//   typeof crypto !== "undefined" && crypto.randomUUID
//     ? crypto.randomUUID()
//     : Math.random().toString(36).slice(2);

// // Количество дней в месяце
// const daysInMonth = (year: number, month1to12: number) =>
//   new Date(year, month1to12, 0).getDate();

// // Простая проверка мобильного UA
// const isMobileUA = () =>
//   typeof navigator !== "undefined" &&
//   /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);

// // Кастомный инпут с forwardRef — нужен, чтобы управлять фокусом (blur → focus)
// const DateInput = forwardRef<
//   HTMLInputElement,
//   React.InputHTMLAttributes<HTMLInputElement>
// >(({ className = "", ...props }, ref) => (
//   <input
//     {...props}
//     ref={ref}
//     className={
//       className ||
//       "mt-1 w-56 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
//     }
//   />
// ));
// DateInput.displayName = "DateInput";

// export function GraphContent() {
//   const [selectedDate, setSelectedDate] = useState<Date | null>(null);
//   const [calories, setCalories] = useState<string>("");
//   const [points, setPoints] = useState<RawPoint[]>([]);
//   const [error, setError] = useState<string>("");

//   // Мобильность определяем один раз на клиенте
//   const isMobile = useMemo(isMobileUA, []);

//   // Управление показом клавиатуры на мобильных
//   const [allowTyping, setAllowTyping] = useState(false); // можно ли печатать в поле даты
//   const [calendarOpen, setCalendarOpen] = useState(false); // открыт ли календарь
//   const dateInputRef = useRef<HTMLInputElement | null>(null);

//   // Минимальная дата среди всех точек (UTC)
//   const minDateMs = useMemo(() => {
//     if (!points.length) return null;
//     return Math.min(...points.map((p) => Date.UTC(p.year, p.month - 1, p.day)));
//   }, [points]);

//   // Динамический шаг по Y (пикселей на 1 калорию)
//   const caloriePixelStep = useMemo(() => {
//     const drawableHeight =
//       GRAPH_HEIGHT - GRAPH_TOP_PADDING - GRAPH_BOTTOM_PADDING;
//     const range = Math.max(1, CALORIES_MAX - CALORIES_MIN);
//     return drawableHeight / range;
//   }, []);

//   // Координаты и сортировка по времени (год-месяц-день)
//   const pointsWithCoords = useMemo(() => {
//     if (!points.length) return [];

//     return points
//       .map((p) => {
//         const timeMs = Date.UTC(p.year, p.month - 1, p.day);
//         const baseMs = minDateMs ?? timeMs;
//         const daysDiff = (timeMs - baseMs) / MS_PER_DAY; // целое число

//         const x = daysDiff * DAY_PIXEL_STEP;

//         const y =
//           GRAPH_HEIGHT -
//           GRAPH_BOTTOM_PADDING -
//           (p.calories - CALORIES_MIN) * caloriePixelStep;

//         return { ...p, x, y };
//       })
//       .sort((a, b) => {
//         if (a.year !== b.year) return a.year - b.year;
//         if (a.month !== b.month) return a.month - b.month;
//         return a.day - b.day;
//       });
//   }, [points, minDateMs, caloriePixelStep]);

//   const graphWidth = useMemo(() => {
//     if (!pointsWithCoords.length) return DEFAULT_GRAPH_WIDTH;
//     const last = pointsWithCoords[pointsWithCoords.length - 1];
//     return Math.max(last.x + DAY_PIXEL_STEP, DEFAULT_GRAPH_WIDTH);
//   }, [pointsWithCoords]);

//   const handleAddPoint = () => {
//     if (!selectedDate || !calories) {
//       setError("Выберите дату и укажите значение.");
//       return;
//     }

//     const yearValue = selectedDate.getFullYear();
//     const monthValue = selectedDate.getMonth() + 1; // 0..11 -> 1..12
//     const dayValue = selectedDate.getDate();
//     const caloriesValue = Number(calories);

//     if (Number.isNaN(caloriesValue)) {
//       setError("Некорректный ввод калорий.");
//       return;
//     }

//     if (monthValue < 1 || monthValue > 12) {
//       setError("Некорректный месяц.");
//       return;
//     }

//     const dim = daysInMonth(yearValue, monthValue);
//     if (dayValue < 1 || dayValue > dim) {
//       setError("Некорректный день месяца.");
//       return;
//     }

//     if (caloriesValue < CALORIES_MIN || caloriesValue > CALORIES_MAX) {
//       setError(
//         `Значение должно быть в диапазоне ${CALORIES_MIN}-${CALORIES_MAX}.`
//       );
//       return;
//     }

//     const nextPoint: RawPoint = {
//       id: createId(),
//       year: yearValue,
//       month: monthValue,
//       day: dayValue,
//       calories: caloriesValue,
//     };

//     setPoints((prev) => [...prev, nextPoint]);
//     setError("");
//     setCalories("");
//     // Дату оставляем, чтобы можно было добавлять несколько точек подряд
//   };

//   return (
//     <section className="flex w-full flex-col gap-4 rounded-xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
//       <h2 className="text-xl font-semibold text-slate-800">График калорий</h2>

//       <div className="flex flex-wrap items-end gap-4">
//         <label className="flex flex-col text-sm text-slate-700">
//           Дата
//           <DatePicker
//             selected={selectedDate}
//             onChange={(d) => setSelectedDate(d)}
//             placeholderText="Выберите дату"
//             dateFormat="dd-MM-yyyy"
//             locale={ru}
//             showMonthDropdown
//             showYearDropdown
//             dropdownMode="select"
//             showPopperArrow={false}
//             isClearable
//             todayButton="Сегодня"
//             // КЛЮЧЕВОЕ: на мобильных по умолчанию не даём печатать, чтобы не вызывать клавиатуру
//             readOnly={isMobile && !allowTyping}
//             // Отслеживаем открытие/закрытие календаря
//             onCalendarOpen={() => setCalendarOpen(true)}
//             onCalendarClose={() => {
//               setCalendarOpen(false);
//               setAllowTyping(false); // при закрытии снова запрещаем ручной ввод
//             }}
//             // Если календарь открыт и пользователь повторно тапает по полю —
//             // включаем ввод и принудительно показываем клавиатуру
//             onInputClick={() => {
//               if (isMobile && calendarOpen && !allowTyping) {
//                 setAllowTyping(true);
//                 // Чтобы ОС показала клавиатуру: blur → focus
//                 requestAnimationFrame(() => {
//                   const el = dateInputRef.current;
//                   if (!el) return;
//                   el.blur();
//                   setTimeout(() => el.focus(), 0);
//                 });
//               }
//             }}
//             // Используем кастомный инпут, чтобы получить реф на реальный <input>
//             customInput={
//               <DateInput
//                 ref={dateInputRef}
//                 inputMode={isMobile && !allowTyping ? "none" : "text"}
//                 className="mt-1 w-56 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
//               />
//             }
//           />
//         </label>

//         <label className="flex flex-col text-sm text-slate-700">
//           Потреблённые калории
//           <input
//             type="number"
//             min={CALORIES_MIN}
//             max={CALORIES_MAX}
//             className="mt-1 w-48 rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
//             placeholder={`Введите значение (${CALORIES_MIN}-${CALORIES_MAX})`}
//             value={calories}
//             onChange={(event) => setCalories(event.target.value)}
//           />
//         </label>

//         <button
//           type="button"
//           className="inline-flex items-center rounded-md bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus-visible:outline  focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
//           onClick={handleAddPoint}
//         >
//           Добавить
//         </button>
//       </div>

//       {error ? (
//         <p className="text-sm font-medium text-red-600">{error}</p>
//       ) : null}

//       <div className="relative h-[300px] w-full overflow-auto rounded-lg bg-yellow-200">
//         <svg
//           className="h-full"
//           width={graphWidth}
//           height={GRAPH_HEIGHT}
//           viewBox={`0 0 ${graphWidth} ${GRAPH_HEIGHT}`}
//         >
//           {/* Линии */}
//           {pointsWithCoords.slice(1).map((point, index) => {
//             const previous = pointsWithCoords[index];
//             return (
//               <line
//                 key={`${point.id}-line`}
//                 x1={previous.x}
//                 y1={previous.y}
//                 x2={point.x}
//                 y2={point.y}
//                 stroke="rgb(59 130 246)"
//                 strokeWidth={4}
//               />
//             );
//           })}

//           {/* Точки */}
//           {pointsWithCoords.map((point) => (
//             <g key={point.id}>
//               <circle
//                 cx={point.x}
//                 cy={point.y}
//                 r={4}
//                 fill="rgb(59 130 246)"
//                 strokeWidth={1.5}
//               />
//               <title>{`Дата: ${String(point.day).padStart(2, "0")}.${String(
//                 point.month
//               ).padStart(2, "0")}.${point.year}, значение: ${
//                 point.calories
//               }`}</title>
//             </g>
//           ))}
//         </svg>
//       </div>
//     </section>
//   );
// }

// "use client";
// import { useMemo, useState } from "react";
// import DatePicker from "react-datepicker";
// import { ru } from "date-fns/locale/ru";

// type RawPoint = {
//   id: string;
//   year: number;
//   month: number; // 1..12
//   day: number; // 1..31 (зависит от месяца)
//   calories: number; // 0..5000
// };

// const DAY_PIXEL_STEP = 10;
// const GRAPH_HEIGHT = 300;
// const GRAPH_TOP_PADDING = 10;
// const GRAPH_BOTTOM_PADDING = 10;

// const DEFAULT_GRAPH_WIDTH = 600;
// const CALORIES_MIN = 0;
// const CALORIES_MAX = 5000;

// const MS_PER_DAY = 24 * 60 * 60 * 1000;

// const createId = () =>
//   typeof crypto !== "undefined" && crypto.randomUUID
//     ? crypto.randomUUID()
//     : Math.random().toString(36).slice(2);

// // Количество дней в месяце
// const daysInMonth = (year: number, month1to12: number) =>
//   new Date(year, month1to12, 0).getDate();

// export function GraphContent() {
//   const [selectedDate, setSelectedDate] = useState<Date | null>(null);
//   const [calories, setCalories] = useState<string>("");
//   const [points, setPoints] = useState<RawPoint[]>([]);
//   const [error, setError] = useState<string>("");

//   // Минимальная дата среди всех точек (UTC)
//   const minDateMs = useMemo(() => {
//     if (!points.length) return null;
//     return Math.min(...points.map((p) => Date.UTC(p.year, p.month - 1, p.day)));
//   }, [points]);

//   // Динамический шаг по Y (пикселей на 1 калорию)
//   const caloriePixelStep = useMemo(() => {
//     const drawableHeight =
//       GRAPH_HEIGHT - GRAPH_TOP_PADDING - GRAPH_BOTTOM_PADDING;
//     const range = Math.max(1, CALORIES_MAX - CALORIES_MIN);
//     return drawableHeight / range;
//   }, []);

//   // Координаты и сортировка по времени (год-месяц-день)
//   const pointsWithCoords = useMemo(() => {
//     if (!points.length) return [];

//     return points
//       .map((p) => {
//         const timeMs = Date.UTC(p.year, p.month - 1, p.day);
//         const baseMs = minDateMs ?? timeMs;
//         const daysDiff = (timeMs - baseMs) / MS_PER_DAY; // целое число

//         const x = daysDiff * DAY_PIXEL_STEP;

//         const y =
//           GRAPH_HEIGHT -
//           GRAPH_BOTTOM_PADDING -
//           (p.calories - CALORIES_MIN) * caloriePixelStep;

//         return { ...p, x, y };
//       })
//       .sort((a, b) => {
//         if (a.year !== b.year) return a.year - b.year;
//         if (a.month !== b.month) return a.month - b.month;
//         return a.day - b.day;
//       });
//   }, [points, minDateMs, caloriePixelStep]);

//   const graphWidth = useMemo(() => {
//     if (!pointsWithCoords.length) return DEFAULT_GRAPH_WIDTH;
//     const last = pointsWithCoords[pointsWithCoords.length - 1];
//     return Math.max(last.x + DAY_PIXEL_STEP, DEFAULT_GRAPH_WIDTH);
//   }, [pointsWithCoords]);

//   const handleAddPoint = () => {
//     if (!selectedDate || !calories) {
//       setError("Выберите дату и укажите значение.");
//       return;
//     }

//     const yearValue = selectedDate.getFullYear();
//     const monthValue = selectedDate.getMonth() + 1; // 0..11 -> 1..12
//     const dayValue = selectedDate.getDate();
//     const caloriesValue = Number(calories);

//     if (Number.isNaN(caloriesValue)) {
//       setError("Некорректный ввод калорий.");
//       return;
//     }

//     if (monthValue < 1 || monthValue > 12) {
//       setError("Некорректный месяц.");
//       return;
//     }

//     const dim = daysInMonth(yearValue, monthValue);
//     if (dayValue < 1 || dayValue > dim) {
//       setError("Некорректный день месяца.");
//       return;
//     }

//     if (caloriesValue < CALORIES_MIN || caloriesValue > CALORIES_MAX) {
//       setError(
//         `Значение должно быть в диапазоне ${CALORIES_MIN}-${CALORIES_MAX}.`
//       );
//       return;
//     }

//     const nextPoint: RawPoint = {
//       id: createId(),
//       year: yearValue,
//       month: monthValue,
//       day: dayValue,
//       calories: caloriesValue,
//     };

//     setPoints((prev) => [...prev, nextPoint]);
//     setError("");
//     setCalories("");
//     // Дату оставляем, чтобы можно было добавлять несколько точек подряд
//   };

//   return (
//     <section className="flex w-full flex-col gap-4 rounded-xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
//       <h2 className="text-xl font-semibold text-slate-800">График калорий</h2>

//       <div className="flex flex-wrap items-end gap-4">
//         <label className="flex flex-col text-sm text-slate-700">
//           Дата
//           <DatePicker
//             selected={selectedDate}
//             onChange={(d) => setSelectedDate(d)}
//             placeholderText="Выберите дату"
//             dateFormat="dd-MM-yyyy"
//             locale={ru}
//             showMonthDropdown
//             showYearDropdown
//             dropdownMode="select"
//             showPopperArrow={false}
//             isClearable
//             todayButton="Сегодня"
//             className="mt-1 w-56 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
//           />
//         </label>

//         <label className="flex flex-col text-sm text-slate-700">
//           Потреблённые калории
//           <input
//             type="number"
//             min={CALORIES_MIN}
//             max={CALORIES_MAX}
//             className="mt-1 w-48 rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
//             placeholder={`Введите значение (${CALORIES_MIN}-${CALORIES_MAX})`}
//             value={calories}
//             onChange={(event) => setCalories(event.target.value)}
//           />
//         </label>

//         <button
//           type="button"
//           className="inline-flex items-center rounded-md bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus-visible:outline  focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
//           onClick={handleAddPoint}
//         >
//           Добавить
//         </button>
//       </div>

//       {error ? (
//         <p className="text-sm font-medium text-red-600">{error}</p>
//       ) : null}

//       <div className="relative h-[300px] w-full overflow-auto rounded-lg bg-yellow-200">
//         <svg
//           className="h-full"
//           width={graphWidth}
//           height={GRAPH_HEIGHT}
//           viewBox={`0 0 ${graphWidth} ${GRAPH_HEIGHT}`}
//         >
//           {/* Линии */}
//           {pointsWithCoords.slice(1).map((point, index) => {
//             const previous = pointsWithCoords[index];
//             return (
//               <line
//                 key={`${point.id}-line`}
//                 x1={previous.x}
//                 y1={previous.y}
//                 x2={point.x}
//                 y2={point.y}
//                 stroke="rgb(59 130 246)"
//                 strokeWidth={4}
//               />
//             );
//           })}

//           {/* Точки */}
//           {pointsWithCoords.map((point) => (
//             <g key={point.id}>
//               <circle
//                 cx={point.x}
//                 cy={point.y}
//                 r={4}
//                 fill="rgb(59 130 246)"
//                 strokeWidth={1.5}
//               />
//               <title>{`Дата: ${String(point.day).padStart(2, "0")}.${String(
//                 point.month
//               ).padStart(2, "0")}.${point.year}, значение: ${
//                 point.calories
//               }`}</title>
//             </g>
//           ))}
//         </svg>
//       </div>
//     </section>
//   );
// }
