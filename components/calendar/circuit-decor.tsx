const TRACK_PATHS = [
  'M14 48 C14 26, 36 16, 62 18 L112 20 C128 20, 134 32, 122 42 L94 46 C82 48, 80 60, 96 62 L130 64 C142 66, 140 80, 122 82 L38 82 C20 82, 14 68, 14 48 Z',
  'M18 68 L34 26 C40 16, 56 14, 70 24 L92 38 C104 44, 118 30, 130 24 C142 20, 146 38, 136 52 L116 74 C106 84, 86 84, 72 74 L48 64 L26 78 C16 82, 12 76, 18 68 Z',
  'M16 56 C16 32, 42 18, 76 18 C110 18, 138 28, 138 48 C138 64, 118 66, 102 58 L78 46 C64 40, 52 50, 60 64 L72 78 C50 84, 16 78, 16 56 Z',
  'M22 24 L98 20 C122 20, 138 34, 134 52 C130 68, 112 72, 98 62 L82 50 L64 68 C52 80, 30 82, 20 68 C12 56, 14 34, 22 24 Z',
  'M16 72 L28 36 C34 22, 52 18, 66 28 L76 38 L104 20 C122 14, 140 28, 134 46 L118 76 C110 86, 92 82, 84 70 L66 56 L42 78 C28 84, 12 82, 16 72 Z',
  'M20 42 C24 22, 50 16, 82 22 L126 30 C140 34, 142 54, 126 62 L88 66 L74 80 C58 86, 34 82, 24 68 C16 58, 18 50, 20 42 Z',
]

export function CircuitDecor({ round }: { round: number }) {
  const path = TRACK_PATHS[(round - 1) % TRACK_PATHS.length]
  return (
    <svg
      viewBox="0 0 156 96"
      className="f1-circuit-svg"
      aria-hidden="true"
      fill="none"
    >
      <path
        d={path}
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.22"
      />
      <path
        d={path}
        stroke="var(--primary)"
        strokeWidth="2"
        strokeDasharray="18 140"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
    </svg>
  )
}

