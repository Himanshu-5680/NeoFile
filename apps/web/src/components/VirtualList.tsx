import { useEffect, useRef, useState, type ReactNode } from "react";

export function VirtualList({
  count,
  rowHeight,
  className,
  children,
}: {
  count: number;
  rowHeight: number;
  className?: string;
  children: (index: number) => ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [height, setHeight] = useState(320);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setHeight(el.clientHeight || 320);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - 6);
  const end = Math.min(count, Math.ceil((scrollTop + height) / rowHeight) + 6);

  return (
    <div ref={ref} className={className} style={{ overflow: "auto", height: "100%" }} onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}>
      <div style={{ height: count * rowHeight, position: "relative" }}>
        {Array.from({ length: Math.max(0, end - start) }, (_, offset) => {
          const index = start + offset;
          return (
            <div key={index} style={{ position: "absolute", top: index * rowHeight, height: rowHeight, left: 0, right: 0 }}>
              {children(index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
