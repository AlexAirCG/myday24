"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";

type ElasticScrollProps = {
  className?: string;
  children: React.ReactNode;
  maxStretch?: number; // px
  resistance?: number; // 0..1
  springMs?: number; // длительность возврата
};

export default function ElasticScroll({
  className,
  children,
  maxStretch = 60,
  resistance = 0.35,
  springMs = 200,
}: ElasticScrollProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  const [offset, setOffset] = useState(0);
  const [isElastic, setIsElastic] = useState(false);

  // Служебные флаги/значения
  const startXRef = useRef(0);
  const elasticModeRef = useRef(false); // активирован ли «резиновый» режим для текущего жеста
  const runningRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Подстраховка CSS для предотвращения chain-scroll наружу
    // Можно также вынести в tailwind класс: [overscroll-behavior-x:contain]
    el.style.overscrollBehaviorX = "contain";

    const onTouchStart = (ev: TouchEvent) => {
      const t = ev.touches[0];
      startXRef.current = t.clientX;
      runningRef.current = true;
      elasticModeRef.current = false;
      setIsElastic(false);
      setOffset(0);
      el.style.transition = "none";
    };

    const onTouchMove = (ev: TouchEvent) => {
      if (!runningRef.current) return;
      const t = ev.touches[0];
      const dx = t.clientX - startXRef.current;

      const maxScrollLeft = el.scrollWidth - el.clientWidth;
      const atLeft = el.scrollLeft <= 0;
      const atRight = el.scrollLeft >= maxScrollLeft;

      // На первом движении решаем, включать ли «резинку»
      if (!elasticModeRef.current) {
        const shouldElastic = (atLeft && dx > 0) || (atRight && dx < 0);
        if (shouldElastic) {
          elasticModeRef.current = true;
        } else {
          // Резинка не нужна — даем нативному скроллу работать
          return;
        }
      }

      // Если резинка активна — блокируем нативную прокрутку, если это возможно
      if (ev.cancelable) {
        ev.preventDefault();
      }

      const rawStretch = dx;
      const stretch = Math.max(
        Math.min(rawStretch * resistance, maxStretch),
        -maxStretch
      );

      setIsElastic(true);
      setOffset(stretch);
    };

    const end = () => {
      if (!runningRef.current) return;
      runningRef.current = false;

      // Возврат в исходное положение
      el.style.transition = `transform ${springMs}ms ease-out`;
      setOffset(0);
      setIsElastic(false);

      const t = setTimeout(() => {
        if (ref.current) ref.current.style.transition = "none";
      }, springMs + 20);
      // Очистка таймера при быстром анмаунте
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      return () => clearTimeout(t);
    };

    // Обратите внимание: passive: false на touchmove критичен
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", end, { passive: true });
    el.addEventListener("touchcancel", end, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", end);
      el.removeEventListener("touchcancel", end);
    };
  }, [maxStretch, resistance, springMs]);

  return (
    <div
      ref={ref}
      className={clsx(
        className,
        // Горизонтальные жесты; на iOS это не всегда достаточно, поэтому у нас есть preventDefault
        "[touch-action:pan-x] md:[touch-action:auto]",
        // Избежать chain-scroll наружу
        "[overscroll-behavior-x:contain]",
        "will-change-transform"
      )}
      style={{
        transform:
          isElastic && offset !== 0
            ? `translateX(${offset}px)`
            : "translateX(0)",
      }}
    >
      {children}
    </div>
  );
}
