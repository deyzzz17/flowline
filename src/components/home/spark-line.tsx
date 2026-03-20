export const SparkLine = ({
  data,
  strokeLight,
  strokeDark,
  fillLight,
  fillDark,
}: {
  data: number[]
  strokeLight: string
  strokeDark: string
  fillLight: string
  fillDark: string
}) => {
  const w = 280
  const h = 80
  const pad = 4
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2)
    const y = pad + (1 - (v - min) / range) * (h - pad * 2)
    return [x, y] as [number, number]
  })

  const path = pts.reduce((acc, [x, y], i) => {
    if (i === 0) return `M ${x} ${y}`
    const [px, py] = pts[i - 1]
    const cx1 = px + (x - px) / 2
    const cy1 = py
    const cx2 = px + (x - px) / 2
    const cy2 = y
    return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x} ${y}`
  }, '')

  const fillPath = `${path} L ${pts[pts.length - 1][0]} ${h} L ${pts[0][0]} ${h} Z`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: h }}>
      <defs>
        <linearGradient id="fill-light" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillLight} stopOpacity="0.35" />
          <stop offset="100%" stopColor={fillLight} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="fill-dark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillDark} stopOpacity="0.35" />
          <stop offset="100%" stopColor={fillDark} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill="url(#fill-light)" className="dark:hidden" />
      <path d={fillPath} fill="url(#fill-dark)" className="hidden dark:block" />
      <path
        d={path}
        fill="none"
        stroke={strokeLight}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="dark:hidden"
      />
      <path
        d={path}
        fill="none"
        stroke={strokeDark}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="hidden dark:block"
      />
      <circle
        cx={pts[pts.length - 1][0]}
        cy={pts[pts.length - 1][1]}
        r="3"
        fill={strokeLight}
        className="dark:hidden"
      />
      <circle
        cx={pts[pts.length - 1][0]}
        cy={pts[pts.length - 1][1]}
        r="3"
        fill={strokeDark}
        className="hidden dark:block"
      />
    </svg>
  )
}
