type FlagSpec = {
  bg: string
  bands?: { color: string; y: number; h: number }[]
  verticalBands?: { color: string; x: number; w: number }[]
}

const COUNTRY_FLAGS: Record<string, FlagSpec> = {
  australia: {
    bg: '#00247d',
    bands: [
      { color: '#ffffff', y: 10, h: 4 },
      { color: '#cf142b', y: 11, h: 2 },
    ],
    verticalBands: [
      { color: '#ffffff', x: 10, w: 4 },
      { color: '#cf142b', x: 11, w: 2 },
    ],
  },
  china: {
    bg: '#de2910',
  },
  japan: {
    bg: '#ffffff',
  },
  bahrain: {
    bg: '#ce1126',
    verticalBands: [{ color: '#ffffff', x: 0, w: 8 }],
  },
  'saudi arabia': {
    bg: '#006c35',
    bands: [{ color: '#ffffff', y: 15, h: 2.5 }],
  },
  usa: {
    bg: '#b22234',
    bands: [
      { color: '#ffffff', y: 3, h: 3 },
      { color: '#ffffff', y: 9, h: 3 },
      { color: '#ffffff', y: 15, h: 3 },
      { color: '#ffffff', y: 21, h: 3 },
    ],
  },
  'united states': {
    bg: '#b22234',
    bands: [
      { color: '#ffffff', y: 3, h: 3 },
      { color: '#ffffff', y: 9, h: 3 },
      { color: '#ffffff', y: 15, h: 3 },
      { color: '#ffffff', y: 21, h: 3 },
    ],
  },
  canada: {
    bg: '#ffffff',
    verticalBands: [
      { color: '#ff0000', x: 0, w: 6 },
      { color: '#ff0000', x: 18, w: 6 },
    ],
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
    bands: [
      { color: '#ffffff', y: 9, h: 6 },
      { color: '#c8102e', y: 10.5, h: 3 },
    ],
    verticalBands: [
      { color: '#ffffff', x: 9, w: 6 },
      { color: '#c8102e', x: 10.5, w: 3 },
    ],
  },
  'united kingdom': {
    bg: '#012169',
    bands: [
      { color: '#ffffff', y: 9, h: 6 },
      { color: '#c8102e', y: 10.5, h: 3 },
    ],
    verticalBands: [
      { color: '#ffffff', x: 9, w: 6 },
      { color: '#c8102e', x: 10.5, w: 3 },
    ],
  },
  'great britain': {
    bg: '#012169',
    bands: [
      { color: '#ffffff', y: 9, h: 6 },
      { color: '#c8102e', y: 10.5, h: 3 },
    ],
    verticalBands: [
      { color: '#ffffff', x: 9, w: 6 },
      { color: '#c8102e', x: 10.5, w: 3 },
    ],
  },
  belgium: {
    bg: '#fae042',
    verticalBands: [
      { color: '#000000', x: 0, w: 8 },
      { color: '#ed2939', x: 16, w: 8 },
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
      { color: '#009246', x: 0, w: 8 },
      { color: '#ce2b37', x: 16, w: 8 },
    ],
  },
  azerbaijan: {
    bg: '#ed2939',
    bands: [
      { color: '#00b5e2', y: 0, h: 8 },
      { color: '#509e2f', y: 16, h: 8 },
    ],
  },
  singapore: {
    bg: '#ffffff',
    bands: [{ color: '#ef3340', y: 0, h: 12 }],
  },
  mexico: {
    bg: '#ffffff',
    verticalBands: [
      { color: '#006847', x: 0, w: 8 },
      { color: '#ce1126', x: 16, w: 8 },
    ],
  },
  brazil: {
    bg: '#009c3b',
  },
  qatar: {
    bg: '#8a1538',
    verticalBands: [{ color: '#ffffff', x: 0, w: 8 }],
  },
  uae: {
    bg: '#ffffff',
    bands: [
      { color: '#00732f', y: 0, h: 8 },
      { color: '#000000', y: 16, h: 8 },
    ],
    verticalBands: [{ color: '#ff0000', x: 0, w: 7 }],
  },
  'united arab emirates': {
    bg: '#ffffff',
    bands: [
      { color: '#00732f', y: 0, h: 8 },
      { color: '#000000', y: 16, h: 8 },
    ],
    verticalBands: [{ color: '#ff0000', x: 0, w: 7 }],
  },
  'abu dhabi': {
    bg: '#ffffff',
    bands: [
      { color: '#00732f', y: 0, h: 8 },
      { color: '#000000', y: 16, h: 8 },
    ],
    verticalBands: [{ color: '#ff0000', x: 0, w: 7 }],
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
      <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid slice">
        <rect width="24" height="24" fill={spec.bg} />
        {spec.bands?.map((band, i) => (
          <rect key={`h-${i}`} x="0" y={band.y} width="24" height={band.h} fill={band.color} />
        ))}
        {spec.verticalBands?.map((band, i) => (
          <rect key={`v-${i}`} x={band.x} y="0" width={band.w} height="24" fill={band.color} />
        ))}
        {key === 'usa' || key === 'united states' ? (
          <rect x="0" y="0" width="12" height="12" fill="#3c3b6e" />
        ) : null}
        {key === 'japan' ? <circle cx="12" cy="12" r="5" fill="#bc002d" /> : null}
        {key === 'brazil' ? (
          <>
            <polygon points="12,4 21,12 12,20 3,12" fill="#ffdf00" />
            <circle cx="12" cy="12" r="3.6" fill="#002776" />
          </>
        ) : null}
        {key === 'canada' ? <circle cx="12" cy="12" r="3.2" fill="#ff0000" /> : null}
        {key === 'china' ? <circle cx="8" cy="8" r="2.6" fill="#ffde00" /> : null}
        {key === 'azerbaijan' ? <circle cx="12" cy="12" r="2" fill="#ffffff" /> : null}
      </svg>
    </span>
  )
}
