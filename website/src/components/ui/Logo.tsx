export function Logo({
  size = 38,
  showName = true,
  onDark = false,
}: {
  size?: number;
  showName?: boolean;
  onDark?: boolean;
}) {
  return (
    <div className="group flex items-center gap-2.5">
      <div
        className="relative grid place-items-center rounded-xl bg-navy text-white shadow-navy transition-transform duration-300 group-hover:scale-105"
        style={{ width: size, height: size }}
      >
        <span className="font-display text-[15px] font-extrabold leading-none tracking-tight">
          LP
        </span>
        <span className="absolute right-1.5 top-1 text-[8px] font-bold text-amber">
          +
        </span>
      </div>
      {showName && (
        <span
          className={`font-display text-[18px] font-extrabold tracking-tight ${
            onDark ? "text-white" : "text-text"
          }`}
        >
          LaundryPro
        </span>
      )}
    </div>
  );
}
