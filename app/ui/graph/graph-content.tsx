"use client";
import { forwardRef } from "react";
import { useMemo, useState, useRef, useEffect } from "react";
import DatePicker from "react-datepicker";
import { ru } from "date-fns/locale/ru";
import {
  loadGraphPoints,
  upsertGraphPoint,
  type GraphPoint as StoredPoint,
} from "@/app/lib/actions";

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
const CALORIES_MIN = 1200;
const CALORIES_MAX = 3300;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Количество дней в месяце
const daysInMonth = (year: number, month1to12: number) =>
  new Date(year, month1to12, 0).getDate();

function isFiniteNum(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function toUtcMs(y: number, m1to12: number, d: number) {
  if (!Number.isInteger(y) || !Number.isInteger(m1to12) || !Number.isInteger(d))
    return NaN;
  if (m1to12 < 1 || m1to12 > 12) return NaN;
  const dim = daysInMonth(y, m1to12);
  if (d < 1 || d > dim) return NaN;
  return Date.UTC(y, m1to12 - 1, d);
}

export function GraphContent() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calories, setCalories] = useState<string>("");
  const [points, setPoints] = useState<RawPoint[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [marker, setMarker] = useState<{ x: number; y: number } | null>(null);

  // загрузка точек при монтировании
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await loadGraphPoints();
        if (!cancelled) {
          setPoints(data);
        }
      } catch (e) {
        console.error("Failed to load graph points:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // измерение ширины контейнера
  const scrollRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(DEFAULT_GRAPH_WIDTH);

  // измерение ширины контейнера
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () =>
      setContainerWidth(
        Number.isFinite(el.clientWidth) && el.clientWidth > 0
          ? el.clientWidth
          : DEFAULT_GRAPH_WIDTH
      );

    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  // Минимальная дата среди всех точек (UTC)
  const minDateMs = useMemo(() => {
    if (!points.length) return null;
    const times = points
      .map((p) => toUtcMs(p.year, p.month, p.day))
      .filter(isFiniteNum);
    return times.length ? Math.min(...times) : null;
  }, [points]);

  const caloriePixelStep = useMemo(() => {
    const drawableHeight =
      GRAPH_HEIGHT - GRAPH_TOP_PADDING - GRAPH_BOTTOM_PADDING;
    const range = Math.max(1, CALORIES_MAX - CALORIES_MIN);
    return drawableHeight / range;
  }, []);

  const pointsWithCoords = useMemo(() => {
    if (!points.length) return [];

    const result: Array<RawPoint & { x: number; y: number }> = [];

    for (const p of points) {
      const timeMs = toUtcMs(p.year, p.month, p.day);
      if (!isFiniteNum(timeMs)) continue;

      const baseMs =
        minDateMs !== null && isFiniteNum(minDateMs) ? minDateMs : timeMs;

      const daysDiff = (timeMs - baseMs) / MS_PER_DAY;
      const x = daysDiff * DAY_PIXEL_STEP;

      // на всякий случай приведём калории к числу
      const c =
        typeof p.calories === "number" ? p.calories : Number(p.calories);
      if (!isFiniteNum(c)) continue;

      const y =
        GRAPH_HEIGHT -
        GRAPH_BOTTOM_PADDING -
        (c - CALORIES_MIN) * caloriePixelStep;

      if (!isFiniteNum(x) || !isFiniteNum(y)) continue;

      result.push({ ...p, x, y });
    }

    result.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      if (a.month !== b.month) return a.month - b.month;
      return a.day - b.day;
    });

    return result;
  }, [points, minDateMs, caloriePixelStep]);

  const dateKey = (y: number, m: number, d: number) =>
    `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  // NEW: заменить/добавить точку по дате
  const upsertLocalPointByDate = (np: RawPoint) => {
    setPoints((prev) => {
      const key = dateKey(np.year, np.month, np.day);
      const idx = prev.findIndex(
        (p) => dateKey(p.year, p.month, p.day) === key
      );
      if (idx === -1) return [...prev, np];
      const copy = prev.slice();
      copy[idx] = { ...copy[idx], ...np };
      return copy;
    });
  };

  const handleAddPoint = async () => {
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

    try {
      setLoading(true);
      setError("");

      // Сохраняем на сервер (UPSERT по дате)
      const saved = await upsertGraphPoint({
        year: yearValue,
        month: monthValue,
        day: dayValue,
        calories: caloriesValue,
      });

      // Синхронизируем локальное состояние — заменить/добавить по дате
      upsertLocalPointByDate({
        id: saved.id,
        year: saved.year,
        month: saved.month,
        day: saved.day,
        calories: saved.calories,
      });

      setCalories("");
      // Дату оставляем, чтобы можно было добавлять подряд
    } catch (e: unknown) {
      console.error(e);
      const message =
        e instanceof Error
          ? e.message
          : typeof e === "string"
          ? e
          : (typeof e === "object" &&
              e !== null &&
              "message" in e &&
              typeof (e as { message?: unknown }).message === "string" &&
              (e as { message?: string }).message) ||
            "Не удалось сохранить точку.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // кастомный инпут с readOnly через customInput:
  const DateInput = forwardRef<
    HTMLInputElement,
    React.InputHTMLAttributes<HTMLInputElement>
  >(({ value, onClick, placeholder }, ref) => (
    <input
      ref={ref}
      value={(value as string) ?? ""}
      onClick={onClick}
      placeholder={placeholder}
      readOnly
      className="mt-1 w-56 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
    />
  ));
  DateInput.displayName = "DateInput";

  const gradientStops = useMemo(() => {
    const range = CALORIES_MAX - CALORIES_MIN;
    const redToYellowPercent = 100 - ((2300 - CALORIES_MIN) / range) * 100;
    const yellowToGreenPercent = 100 - ((2000 - CALORIES_MIN) / range) * 100;
    const blendZone = 6;

    return [
      { offset: "0%", color: "rgb(239, 68, 68)", opacity: 0.7 },
      {
        offset: `${Math.max(0, redToYellowPercent - blendZone)}%`,
        color: "rgb(239, 68, 68)",
        opacity: 0.7,
      },
      {
        offset: `${redToYellowPercent}%`,
        color: "rgb(234, 179, 8)",
        opacity: 0.7,
      },
      {
        offset: `${Math.min(100, redToYellowPercent + blendZone)}%`,
        color: "rgb(234, 179, 8)",
        opacity: 0.7,
      },
      {
        offset: `${Math.max(0, yellowToGreenPercent - blendZone)}%`,
        color: "rgb(234, 179, 8)",
        opacity: 0.7,
      },
      {
        offset: `${yellowToGreenPercent}%`,
        color: "rgb(34, 197, 94)",
        opacity: 0.7,
      },
      {
        offset: `${Math.min(100, yellowToGreenPercent + blendZone)}%`,
        color: "rgb(34, 197, 94)",
        opacity: 0.7,
      },
      { offset: "100%", color: "rgb(34, 197, 94)", opacity: 0.7 },
    ];
  }, []);

  const contentWidth = useMemo(() => {
    if (!pointsWithCoords.length) return DEFAULT_GRAPH_WIDTH;
    const last = pointsWithCoords[pointsWithCoords.length - 1];
    const w = last.x + DAY_PIXEL_STEP;
    return Number.isFinite(w)
      ? Math.max(w, DEFAULT_GRAPH_WIDTH)
      : DEFAULT_GRAPH_WIDTH;
  }, [pointsWithCoords]);

  const graphWidth =
    Number.isFinite(contentWidth) && Number.isFinite(containerWidth)
      ? Math.max(contentWidth, containerWidth)
      : DEFAULT_GRAPH_WIDTH;

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
            customInput={<DateInput />}
          />
        </label>

        <label className="flex flex-col text-sm text-slate-700">
          Потреблённые калории
          <input
            type="number"
            min={CALORIES_MIN}
            max={CALORIES_MAX}
            className="mt-1 w-48 rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="ккал"
            value={calories}
            onChange={(event) => setCalories(event.target.value)}
          />
        </label>

        <button
          type="button"
          className="inline-flex items-center rounded-md bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-60"
          onClick={handleAddPoint}
          disabled={loading}
        >
          {loading ? "Сохранение..." : "Добавить"}
        </button>
      </div>

      {error ? (
        <p className="text-sm font-medium text-red-600">{error}</p>
      ) : null}

      <div
        ref={scrollRef}
        className="relative h-[300px] w-full overflow-auto rounded-lg bg-white"
      >
        <svg
          className="h-full"
          width={graphWidth}
          height={GRAPH_HEIGHT}
          viewBox={`0 0 ${graphWidth} ${GRAPH_HEIGHT}`}
        >
          <defs>
            <linearGradient
              id="calorieGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              {gradientStops.map((stop, i) => (
                <stop
                  key={i}
                  offset={stop.offset}
                  stopColor={stop.color}
                  stopOpacity={stop.opacity}
                />
              ))}
            </linearGradient>
          </defs>

          <rect
            x={0}
            y={0}
            width={graphWidth}
            height={GRAPH_HEIGHT}
            fill="url(#calorieGradient)"
            aria-hidden="true"
            onClick={() => setMarker(null)}
          />

          {pointsWithCoords.slice(1).map((point, index) => {
            const previous = pointsWithCoords[index];
            return (
              <line
                key={`${point.id}-line`}
                x1={previous.x}
                y1={previous.y}
                x2={point.x}
                y2={point.y}
                stroke="rgb(31, 92, 184)"
                strokeWidth={4}
              />
            );
          })}

          {pointsWithCoords.map((point) => (
            <g key={point.id}>
              <circle
                onClick={() =>
                  setMarker((prev) =>
                    prev && prev.x === point.x && prev.y === point.y
                      ? null
                      : { x: point.x, y: point.y }
                  )
                }
                cx={point.x}
                cy={point.y}
                r={4.5}
                fill="rgb(31, 92, 184)"
                strokeWidth={1.5}
              />
              <title>{`Дата: ${String(point.day).padStart(2, "0")}.${String(
                point.month
              ).padStart(2, "0")}.${point.year}, значение: ${
                point.calories
              }`}</title>
            </g>
          ))}

          {marker && (
            <g pointerEvents="none">
              <line
                x1={marker.x}
                y1={0}
                x2={marker.x}
                y2={GRAPH_HEIGHT} // было: graphWidth — это опечатка
                stroke="rgba(31, 92, 184, 0.7)"
                strokeWidth={1.5}
                strokeDasharray="6 4"
              />
              <g transform={`translate(${marker.x}, ${GRAPH_TOP_PADDING})`}>
                <rect
                  x={-18}
                  y={-1}
                  width={36}
                  height={14}
                  fill="white"
                  rx={3}
                />
                <text
                  x={0}
                  y={0}
                  dominantBaseline="hanging"
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight={700}
                  fill="#0f172a"
                >
                  75кг
                </text>
              </g>
            </g>
          )}
        </svg>
      </div>
    </section>
  );
}
