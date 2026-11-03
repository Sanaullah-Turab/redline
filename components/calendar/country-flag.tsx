type FlagSpec = {
  bg: string
  bands?: { color: string; y: number; h: number }[]
  verticalBands?: { color: string; x: number; w: number }[]
  accent?: string
}

const COUNTRY_FLAGS: Record<string, FlagSpec> = {
  australia: {
    bg: '#00247d',
    bands: [{ color: '#ffffff', y: 10, h: 4 }, { color: '#cf142b', y: 11, h: 2 }],
    accent: '#ffffff',
  },
  china: {
    bg: '#de2910',
    accent: '#ffde00',
  },
  japan: {
    bg: '#ffffff',
    accent: '#bc002d',
  },
  bahrain: {
    bg: '#ce1126',
    verticalBands: [{ color: '#ffffff', x: 0, w: 9 }],
  },
  'saudi arabia': {
    bg: '#006c35',
    bands: [{ color: '#ffffff', y: 15, h: 3 }],
  },
  usa: {
    bg: '#b22234',
    bands: [
      { color: '#ffffff', y: 4, h: 3 },
      { color: '#ffffff', y: 10, h: 3 },
      { color: '#ffffff', y: 16, h: 3 },
    ],
    accent: '#3c3b6e',
  },
  'united states': {
    bg: '#b22234',
    bands: [
      { color: '#ffffff', y: 4, h: 3 },
      { color: '#ffffff', y: 10, h: 3 },
      { color: '#ffffff', y: 16, h: 3 },
    ],
    accent: '#3c3b6e',
  },
  canada: {
    bg: '#ffffff',
    verticalBands: [
      { color: '#ff0000', x: 0, w: 8 },
      { color: '#ff0000', x: 24, w: 8 },
    ],
    accent: '#ff0000',
  },
  monaco: {
    bg: '#ffffff',
    bands: [{ color: '#ce1126', y: 0, h: 12 }],
  },
  spain: {
    bg: '#aa151b',
    bands: [{ color: '#f1bf00', y: 6, h: 12 }],
  },
  austria: {
    bg: '#ed2939',
    bands: [{ color: '#ffffff', y: 8, h: 8 }],
  },
  uk: {
    bg: '#012169',
    bands: [{ color: '#ffffff', y: 9, h: 6 }, { color: '#c8102e', y: 10, h: 4 }],
    verticalBands: [{ color: '#ffffff', x: 13, w: 6 }, { color: '#c8102e', x: 14, w: 4 }],
  },
  'great britain': {
    bg: '#012169',
    bands: [{ color: '#ffffff', y: 9, h: 6 }, { color: '#c8102e', y: 10, h: 4 }],
    verticalBands: [{ color: '#ffffff', x: 13, w: 6 }, { color: '#c8102e', x: 14, w: 4 }],
  },
  belgium: {
    bg: '#fae042',
    verticalBands: [
      { color: '#000000', x: 0, w: 11 },
      { color: '#ed2939', x: 21, w: 11 },
    ],
  },
  hungary: {
    bg: '#ffffff',
    bands: [
      { color: '#ce2939', y: 0, h: 8 },
      { color: '#477050', y: 16, h: 8 },
    ],
  },
  netherlands: {
    bg: '#ffffff',
    bands: [
      { color: '#ae1c28', y: 0, h: 8 },
      { color: '#21468b', y: 16, h: 8 },
    ],
  },
  italy: {
    bg: '#ffffff',
    verticalBands: [
      { color: '#009246', x: 0, w: 11 },
      { color: '#ce2b37', x: 21, w: 11 },
    ],
  },
  azerbaijan: {
    bg: '#ed2939',
    bands: [
      { color: '#00b5e2', y: 0, h: 8 },
      { color: '#509e2f', y: 16, h: 8 },
    ],
    accent: '#ffffff',
  },
  singapore: {
    bg: '#ffffff',
    bands: [{ color: '#ef3340', y: 0, h: 12 }],
    accent: '#ffffff',
  },
  mexico: {
    bg: '#ffffff',
    verticalBands: [
      { color: '#006847', x: 0, w: 11 },
      { color: '#ce1126', x: 21, w: 11 },
    ],
    accent: '#8c6239',
  },
  brazil: {
    bg: '#009c3b',
    accent: '#ffdf00',
  },
  qatar: {
    bg: '#8a1538',
    verticalBands: [{ color: '#ffffff', x: 0, w: 10 }],
  },
  uae: {
    bg: '#ffffff',
    bands: [
      { color: '#00732f', y: 0, h: 8 },
      { color: '#000000', y: 16, h: 8 },
    ],
    verticalBands: [{ color: '#ff0000', x: 0, w: 9 }],
  },
  'abu dhabi': {
    bg: '#ffffff',
    bands: [
      { color: '#00732f', y: 0, h: 8 },
      { color: '#000000', y: 16, h: 8 },
    ],
    verticalBands: [{ color: '#ff0000', x: 0, w: 9 }],
  },
}

export function CountryFlag({ country }: { country: string }) {
  const key = country.trim().toLowerCase()
  const spec = COUNTRY_FLAGS[key] ?? {
    bg: '#1f2430',
    bands: [{ color: '#ed1b24', y: 0, h: 8 }],
  }

  return (
    <span className="f1-country-flag" aria-hidden="true">
      <svg viewBox="0 0 32 24" className="size-full">
        <rect width="32" height="24" fill={spec.bg} />
        {spec.bands?.map((band, i) => (
          <rect key={`h-${i}`} x="0" y={band.y} width="32" height={band.h} fill={band.color} />
        ))}
        {spec.verticalBands?.map((band, i) => (
          <rect key={`v-${i}`} x={band.x} y="0" width={band.w} height="24" fill={band.color} />
        ))}
        {key === 'usa' || key === 'united states' ? (
          <rect x="0" y="0" width="14" height="13" fill="#3c3b6e" />
        ) : null}
        {key === 'japan' ? <circle cx="16" cy="12" r="6" fill="#bc002d" /> : null}
        {key === 'brazil' ? (
          <>
            <polygon points="16,3 28,12 16,21 4,12" fill="#ffdf00" />
            <circle cx="16" cy="12" r="4.2" fill="#002776" />
          </>
        ) : null}
        {key === 'canada' ? <circle cx="16" cy="12" r="4" fill="#ff0000" /> : null}
        {key === 'china' ? <circle cx="7" cy="7" r="3" fill="#ffde00" /> : null}
      </svg>
    </span>
  )
}
