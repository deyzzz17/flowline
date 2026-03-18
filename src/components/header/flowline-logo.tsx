export const FlowlineLogo = () => {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-9 w-9 shrink-0"
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="10" className="fill-slate-900 dark:fill-white/15" />
      <path
        d="M 7 26 L 14 14 L 21 26"
        stroke="white"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M 14 26 L 21 14 L 28 26"
        stroke="white"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.55"
      />
      <path
        d="M 21 26 L 28 14 L 35 26"
        stroke="white"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.25"
      />
      <line
        x1="7"
        y1="29.5"
        x2="35"
        y2="29.5"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  )
}
