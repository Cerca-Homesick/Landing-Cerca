import type { ReactNode } from 'react'
import { useCopy } from '../i18n'


// Ilustraciones provisionales (planas, sin degradados) que ocupan el lugar de
// las fotografías hasta tener fotos propias o con licencia. Cada una se anuncia
// como "ilustración provisional" a lectores de pantalla.

const C = {
  ink: '#2A2623',
  paper: '#FBF7EF',
  cream: '#F3E8D6',
  stone: '#D8CDBD',
  sky: '#BCD7EC',
  skyDeep: '#8DB3D3',
  butter: '#F4E1A0',
  butterDeep: '#E6C463',
  sage: '#BACBA8',
  sageDeep: '#86A077',
  pink: '#F0C7C3',
  pinkDeep: '#DC9C97',
  clay: '#C9895F',
  coffee: '#6B4A36',
  mauve: '#8D8AA8',
  night: '#56668A',
}

export type ArtName = 'monterrey' | 'napoles' | 'cafe' | 'panaderia' | 'conchas' | 'flores' | 'lluvia'

export function Art({ name }: { name: ArtName }) {
  const art = useCopy().art
  return (
    <svg viewBox="0 0 240 300" role="img" aria-label={`${art.prefix}: ${art[name]}`}>
      {SCENES[name]}
    </svg>
  )
}

const SCENES: Record<ArtName, ReactNode> = {
  monterrey: (
    <>
      <rect width="240" height="300" fill={C.butter} />
      <circle cx="168" cy="96" r="30" fill={C.paper} />
      <path
        d="M0 200 L30 168 L62 128 L86 104 L104 150 L124 122 L150 84 L170 64 L192 112 L240 150 L240 300 L0 300Z"
        fill={C.mauve}
      />
      <path d="M0 226 L60 206 L120 216 L180 200 L240 212 L240 300 L0 300Z" fill={C.sageDeep} />
      <rect x="14" y="214" width="58" height="86" fill={C.pink} />
      <rect x="72" y="232" width="50" height="68" fill={C.cream} />
      <rect x="122" y="208" width="64" height="92" fill={C.sky} />
      <rect x="186" y="236" width="54" height="64" fill={C.pinkDeep} />
      {[
        [26, 232], [48, 232], [26, 262], [48, 262], [84, 248], [104, 248],
        [136, 226], [160, 226], [136, 258], [160, 258], [198, 252], [218, 252],
      ].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="12" height="16" fill={C.paper} opacity="0.85" />
      ))}
      <path d="M0 300 L0 290 L240 290 L240 300Z" fill={C.ink} opacity="0.15" />
    </>
  ),
  napoles: (
    <>
      <rect width="240" height="300" fill={C.pink} />
      <rect x="30" y="34" width="180" height="200" fill={C.sky} />
      <path d="M30 150 L80 118 L104 96 L120 108 L138 92 L172 124 L210 142 L210 160 L30 160Z" fill={C.mauve} />
      <rect x="30" y="160" width="180" height="74" fill={C.skyDeep} />
      <path d="M44 186 h26 M96 200 h34 M150 180 h22 M60 216 h30 M164 214 h28" stroke={C.paper} strokeWidth="3" strokeLinecap="round" />
      <circle cx="64" cy="76" r="14" fill={C.paper} />
      <rect x="30" y="34" width="180" height="200" fill="none" stroke={C.cream} strokeWidth="12" />
      <path d="M120 34 V234" stroke={C.cream} strokeWidth="6" />
      <rect x="16" y="232" width="208" height="16" fill={C.cream} />
      <path d="M150 232 L156 198 L184 198 L190 232Z" fill={C.clay} />
      <path d="M170 198 C160 176 150 170 140 170 M170 198 C172 178 182 166 196 164 M170 198 C168 184 172 172 168 160" stroke={C.sageDeep} strokeWidth="5" fill="none" strokeLinecap="round" />
      <rect x="0" y="248" width="240" height="52" fill={C.pinkDeep} />
    </>
  ),
  cafe: (
    <>
      <rect width="240" height="300" fill={C.sky} />
      <rect y="150" width="240" height="150" fill={C.cream} />
      <path d="M0 150 H240" stroke={C.stone} strokeWidth="4" />
      <ellipse cx="104" cy="218" rx="70" ry="22" fill={C.paper} />
      <path d="M62 160 H146 L138 214 C136 222 72 222 70 214Z" fill={C.paper} stroke={C.stone} strokeWidth="3" />
      <ellipse cx="104" cy="161" rx="42" ry="9" fill={C.coffee} />
      <path d="M146 172 C168 172 168 200 142 200" stroke={C.paper} strokeWidth="9" fill="none" />
      <path d="M146 172 C168 172 168 200 142 200" stroke={C.stone} strokeWidth="3" fill="none" />
      <path d="M86 140 C78 128 94 120 86 104 M112 138 C104 124 122 116 112 98" stroke={C.ink} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.35" />
      <path d="M160 254 C170 230 214 228 226 252 C214 262 172 264 160 254Z" fill={C.butterDeep} />
      <path d="M176 246 L182 236 M192 248 L196 234 M208 248 L208 236" stroke={C.clay} strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  panaderia: (
    <>
      <rect width="240" height="300" fill={C.sky} />
      <rect x="20" y="60" width="200" height="240" fill={C.butter} />
      <rect x="20" y="52" width="200" height="14" fill={C.cream} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <path key={i} d={`M${20 + i * 25} 92 h25 v26 a12.5 10 0 0 1 -25 0Z`} fill={i % 2 ? C.paper : C.pinkDeep} />
      ))}
      <rect x="20" y="88" width="200" height="6" fill={C.pinkDeep} />
      <rect x="34" y="148" width="100" height="92" fill={C.paper} stroke={C.cream} strokeWidth="6" />
      <path d="M40 220 H128" stroke={C.stone} strokeWidth="4" />
      {[54, 84, 112].map((x, i) => (
        <g key={x}>
          <circle cx={x} cy="208" r="13" fill={i === 1 ? C.pink : C.butterDeep} />
          <path d={`M${x - 8} 204 h16 M${x - 6} 210 h12`} stroke={C.paper} strokeWidth="2" />
        </g>
      ))}
      <rect x="150" y="148" width="56" height="152" fill={C.clay} />
      <circle cx="196" cy="226" r="3.5" fill={C.butter} />
      <rect y="284" width="240" height="16" fill={C.stone} />
    </>
  ),
  conchas: (
    <>
      <rect width="240" height="300" fill={C.sage} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={i * 48 - 12} y="0" width="24" height="300" fill={C.paper} opacity="0.28" />
      ))}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect key={i} x="0" y={i * 48 - 12} width="240" height="24" fill={C.paper} opacity="0.28" />
      ))}
      <circle cx="120" cy="150" r="96" fill={C.paper} />
      <circle cx="120" cy="150" r="80" fill="none" stroke={C.stone} strokeWidth="3" />
      {[
        { x: 92, y: 124, fill: C.pink },
        { x: 150, y: 132, fill: C.butterDeep },
        { x: 112, y: 184, fill: C.coffee },
      ].map((c) => (
        <g key={c.x}>
          <circle cx={c.x} cy={c.y} r="30" fill={C.clay} />
          <circle cx={c.x} cy={c.y - 3} r="26" fill={c.fill} />
          <path
            d={`M${c.x - 18} ${c.y - 12} L${c.x + 14} ${c.y + 12} M${c.x - 6} ${c.y - 24} L${c.x + 20} ${c.y - 2} M${c.x + 14} ${c.y - 18} L${c.x - 16} ${c.y + 8} M${c.x + 22} ${c.y - 6} L${c.x - 4} ${c.y + 16}`}
            stroke={C.paper}
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.8"
          />
        </g>
      ))}
    </>
  ),
  flores: (
    <>
      <rect width="240" height="300" fill={C.butter} />
      <rect y="232" width="240" height="68" fill={C.stone} />
      {[
        { x: 60, w: 70, c: C.skyDeep },
        { x: 140, w: 70, c: C.sage },
      ].map((b) => (
        <path key={b.x} d={`M${b.x - b.w / 2} 186 H${b.x + b.w / 2} L${b.x + b.w / 2 - 8} 256 H${b.x - b.w / 2 + 8}Z`} fill={b.c} />
      ))}
      <path d="M50 186 C46 150 40 120 34 96 M64 186 C66 140 70 110 80 84 M58 186 C58 150 56 120 58 70 M132 186 C126 150 120 120 112 92 M146 186 C150 146 158 116 170 96 M140 186 C140 150 142 110 140 74" stroke={C.sageDeep} strokeWidth="4" fill="none" strokeLinecap="round" />
      {[
        [34, 92, C.pinkDeep], [80, 80, C.paper], [58, 66, C.pink], [112, 88, C.paper], [170, 92, C.pinkDeep], [140, 70, C.pink],
        [44, 120, C.paper], [154, 120, C.paper],
      ].map(([x, y, c]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x as number} cy={y as number} r="16" fill={c as string} />
          <circle cx={x as number} cy={y as number} r="5" fill={C.butterDeep} />
        </g>
      ))}
      <rect x="176" y="198" width="44" height="30" fill={C.paper} />
      <path d="M184 210 h28 M184 218 h18" stroke={C.ink} strokeWidth="2.5" opacity="0.5" />
      <path d="M198 198 V186" stroke={C.ink} strokeWidth="2" opacity="0.5" />
    </>
  ),
  lluvia: (
    <>
      <rect width="240" height="300" fill={C.cream} />
      <rect x="28" y="30" width="184" height="200" fill={C.night} />
      {[
        [48, 50], [86, 70], [130, 46], [176, 64], [60, 120], [104, 110], [156, 128], [192, 108], [74, 170], [122, 168], [170, 182],
      ].map(([x, y]) => (
        <path key={`${x}-${y}`} d={`M${x} ${y} l-4 18`} stroke={C.sky} strokeWidth="3" strokeLinecap="round" opacity="0.8" />
      ))}
      <circle cx="176" cy="78" r="9" fill={C.butter} opacity="0.9" />
      <circle cx="58" cy="196" r="6" fill={C.butter} opacity="0.8" />
      <rect x="28" y="30" width="184" height="200" fill="none" stroke={C.paper} strokeWidth="10" />
      <path d="M120 30 V230 M28 130 H212" stroke={C.paper} strokeWidth="6" />
      <rect x="14" y="228" width="212" height="16" fill={C.paper} />
      <path d="M86 228 V196 H124 V228Z" fill={C.butterDeep} />
      <path d="M124 204 C138 204 138 222 124 222" stroke={C.butterDeep} strokeWidth="6" fill="none" />
      <rect y="244" width="240" height="56" fill={C.pink} />
    </>
  ),
}
