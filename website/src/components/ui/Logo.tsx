import Image from "next/image";

export function Logo({
  size = 38,
  showName = true,
  onDark = false,
}: {
  /** Height of the emblem mark in px. */
  size?: number;
  /** Show the "LaundryMax" wordmark beside the emblem. */
  showName?: boolean;
  onDark?: boolean;
}) {
  return (
    <span className="group inline-flex items-center gap-2.5">
      <Image
        src="/logo-mark.png"
        alt="LaundryMax"
        width={480}
        height={462}
        priority
        sizes="48px"
        style={{ height: size, width: "auto" }}
        className="select-none transition-transform duration-300 group-hover:scale-105"
      />
      {showName && (
        <span
          className={`font-display text-[19px] font-extrabold leading-none tracking-tight ${
            onDark ? "text-white" : "text-text"
          }`}
        >
          Laundry
          <span className={onDark ? "text-sky-300" : "text-navy dark:text-sky-400"}>
            Max
          </span>
        </span>
      )}
    </span>
  );
}
