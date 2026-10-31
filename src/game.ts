export type Quirk = 'drift' | 'uneven' | 'sway' | 'pulse'

export type TileMotion = {
  x: string
  y: string
  rotate: string
  duration: string
  delay: string
  amp: string
}

export type Puzzle = {
  id: number
  level: number
  columns: number
  rows: number
  columnTemplate: string
  rowTemplate: string
  odd: number
  base: string
  oddColor: string
  seconds: number
  special: boolean
  sliding: boolean
  quirks: Quirk[]
  tiles: TileMotion[]
}

const randomBelow = (max: number) => {
  const limit = Math.floor(4294967296 / max) * max
  const buffer = new Uint32Array(1)
  let value = 0
  do {
    crypto.getRandomValues(buffer)
    value = buffer[0]
  } while (value >= limit)
  return value % max
}

export const randomUnit = () => randomBelow(1_000_001) / 1_000_000

export const TIME_LIMIT = 5

export const gridSize = (level: number) => (level <= 5 ? 3 : level <= 10 ? 4 : 5)

export const columnCount = (level: number) => {
  if (level < 20) return gridSize(level)
  if (level < 40) return Math.min(10, 6 + Math.floor((level - 20) / 5))
  return Math.min(16, 10 + Math.floor((level - 40) / 10))
}

export const rowCount = (level: number) => {
  if (level < 40) return gridSize(level)
  return Math.min(11, 5 + Math.floor((level - 40) / 10))
}

const CURVE: Array<[number, number]> = [
  [1, 70],
  [14, 80],
  [28, 85],
  [49, 90],
  [70, 98.2],
]

const similarity = (level: number) => {
  const bounded = Math.min(Math.max(level, 1), 70)
  for (let index = 1; index < CURVE.length; index++) {
    const [fromLevel, fromValue] = CURVE[index - 1]
    const [toLevel, toValue] = CURVE[index]
    if (bounded <= toLevel) {
      const ratio =
        (Math.log(bounded) - Math.log(fromLevel)) / (Math.log(toLevel) - Math.log(fromLevel))
      return fromValue + (toValue - fromValue) * ratio
    }
  }
  return 98.2
}

const motionEnergy = (level: number) => {
  const start = similarity(15)
  const end = similarity(40)
  return Math.min(Math.max((similarity(level) - start) / (end - start), 0), 1)
}

const colorGap = (level: number) => {
  const gap = 100 - similarity(level)
  const variance = (randomUnit() * 2 - 1) * Math.max(0.18, gap * 0.1)
  return Math.max(1.6, gap + variance)
}

const shuffled = <T,>(items: T[]) => {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index--) {
    const other = randomBelow(index + 1)
    const swap = copy[index]
    copy[index] = copy[other]
    copy[other] = swap
  }
  return copy
}

const tracks = (count: number) =>
  Array.from({ length: count }, () => `${(0.65 + randomUnit() * 0.95).toFixed(2)}fr`).join(' ')

const stillTile = (): TileMotion => ({
  x: '0%',
  y: '0%',
  rotate: '0deg',
  duration: '0',
  delay: '0',
  amp: '1',
})

const movingTile = (energy: number): TileMotion => {
  const drift = 2.5 + energy * 9
  const tilt = 2 + energy * 7
  const duration = 5.8 - energy * 2.4 + randomUnit() * 2

  return {
    x: `${((randomUnit() * 2 - 1) * drift).toFixed(2)}%`,
    y: `${((randomUnit() * 2 - 1) * drift).toFixed(2)}%`,
    rotate: `${((randomUnit() * 2 - 1) * tilt).toFixed(2)}deg`,
    duration: duration.toFixed(2),
    delay: (-randomUnit() * duration).toFixed(2),
    amp: (1 - (0.04 + energy * 0.07) * randomUnit()).toFixed(3),
  }
}

let nextId = 0

export const makePuzzle = (level: number): Puzzle => {
  const columns = columnCount(level)
  const rows = rowCount(level)
  const sliding = level >= 40
  const special = level >= 15 && !sliding
  const energy = motionEnergy(level)
  const extras = level >= 35 ? 2 : level >= 20 ? 1 : randomBelow(2)
  const quirks: Quirk[] = special
    ? ['drift', 'uneven', ...shuffled<Quirk>(['sway', 'pulse']).slice(0, extras)]
    : []
  const uneven = quirks.includes('uneven')
  const tiles = Array.from({ length: columns * rows }, () => (special ? movingTile(energy) : stillTile()))
  const hue = randomBelow(360)
  const saturation = 54 + randomBelow(22)
  const lightness = 58 + randomBelow(12)
  const oddLightness = Math.max(14, lightness - colorGap(level))

  return {
    id: nextId++,
    level,
    columns,
    rows,
    columnTemplate: uneven ? tracks(columns) : `repeat(${columns}, 1fr)`,
    rowTemplate: uneven ? tracks(rows) : `repeat(${rows}, 1fr)`,
    odd: randomBelow(columns * rows),
    base: `hsl(${hue} ${saturation}% ${lightness}%)`,
    oddColor: `hsl(${hue} ${saturation}% ${oddLightness}%)`,
    seconds: TIME_LIMIT,
    special,
    sliding,
    quirks,
    tiles,
  }
}
