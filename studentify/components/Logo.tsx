export default function Logo({ size = 34 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <span
        className="grid place-items-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-[0_6px_20px_-6px_rgba(99,102,241,0.7)]"
        style={{ width: size, height: size }}
      >
        <svg
          width={size * 0.58}
          height={size * 0.58}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <path
            d="M12 3 2.5 8 12 13l7.5-3.95V15"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6.5 10.7V15c0 1.8 2.46 3.5 5.5 3.5s5.5-1.7 5.5-3.5v-4.3"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="text-lg font-semibold tracking-tight">
        Studentify<span className="text-gradient-brand font-bold"> AI</span>
      </span>
    </span>
  );
}
