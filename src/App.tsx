import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { makePuzzle } from './game'
import type { Quirk, TileMotion } from './game'

const PENALTY = 1000
const BEST_KEY = 'odd-one-best'

const readBest = () => {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0
  } catch {
    return 0
  }
}

const tileStyle = (tile: TileMotion, quirks: Quirk[], paused: boolean): CSSProperties => {
  const animations: string[] = []
  if (quirks.includes('drift')) {
    animations.push('drift calc(var(--duration) * 1s) ease-in-out calc(var(--delay) * 1s) infinite')
  }
  if (quirks.includes('sway')) {
    animations.push('sway calc(var(--duration) * 1.4s) ease-in-out calc(var(--delay) * 1.2s) infinite')
  }
  if (quirks.includes('pulse')) {
    animations.push('pulse calc(var(--duration) * 0.8s) ease-in-out calc(var(--delay) * 0.7s) infinite')
  }

  return {
    '--x': tile.x,
    '--y': tile.y,
    '--rotate': tile.rotate,
    '--duration': tile.duration,
    '--delay': tile.delay,
    '--amp': tile.amp,
    animation: animations.length ? animations.join(', ') : undefined,
    animationPlayState: paused ? 'paused' : undefined,
  } as CSSProperties
}

type TileProps = {
  index: number
  odd: boolean
  revealed: boolean
  motion: TileMotion
  quirks: Quirk[]
  paused: boolean
  onPick: (index: number) => void
}

function Tile({ index, odd, revealed, motion, quirks, paused, onPick }: TileProps) {
  return (
    <button
      type="button"
      className={`tile${odd ? ' is-odd' : ''}${revealed ? ' is-revealed' : ''}`}
      style={tileStyle(motion, quirks, paused)}
      aria-label={`Tile ${index + 1}`}
      onClick={() => onPick(index)}
    />
  )
}

type CountdownProps = {
  seconds: number
  penalty: number
  onExpire: () => void
}

function Countdown({ seconds, penalty, onExpire }: CountdownProps) {
  const total = seconds * 1000
  const [left, setLeft] = useState(total)
  const deadline = useRef(0)
  const expired = useRef(false)

  useEffect(() => {
    expired.current = false
    deadline.current = performance.now() + total
    setLeft(total)
    let frame = 0
    const tick = () => {
      const remaining = deadline.current - performance.now()
      setLeft(Math.max(0, remaining))
      if (remaining <= 0) {
        if (!expired.current) {
          expired.current = true
          onExpire()
        }
        return
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [total, onExpire])

  useEffect(() => {
    if (!penalty) return
    deadline.current -= PENALTY
  }, [penalty])

  const ratio = Math.max(0, Math.min(1, left / total))

  return (
    <div className="timer">
      <span className={penalty ? 'timer-value is-hit' : 'timer-value'} key={penalty}>
        {(left / 1000).toFixed(1)}
      </span>
      <div className="timer-track">
        <div className="timer-fill" style={{ transform: `scaleX(${ratio})` }} />
      </div>
    </div>
  )
}

export default function App() {
  const [phase, setPhase] = useState<'start' | 'playing' | 'over'>('start')
  const [puzzle, setPuzzle] = useState(() => makePuzzle(1))
  const [penalty, setPenalty] = useState(0)
  const [best, setBest] = useState(readBest)
  const level = useRef(puzzle.level)

  useEffect(() => {
    level.current = puzzle.level
  }, [puzzle.level])

  useEffect(() => {
    try {
      localStorage.setItem(BEST_KEY, String(best))
    } catch {
      return
    }
  }, [best])

  const expire = useCallback(() => {
    setPhase('over')
    setBest((value) => Math.max(value, level.current))
  }, [])

  const begin = () => {
    setPuzzle(makePuzzle(1))
    setPenalty(0)
    setPhase('playing')
  }

  const menu = () => {
    setPenalty(0)
    setPhase('start')
  }

  const pick = (index: number) => {
    if (phase !== 'playing') return
    if (index === puzzle.odd) {
      setPuzzle(makePuzzle(puzzle.level + 1))
      setPenalty(0)
    } else {
      setPenalty((value) => value + 1)
    }
  }

  /*
  const skipTarget = Math.min(100, (Math.floor(puzzle.level / 10) + 1) * 10)

  const skip = () => {
    setPuzzle(makePuzzle(skipTarget))
    setPenalty(0)
    setPhase('playing')
  }
  */

  if (phase === 'start') {
    return (
      <main className="app">
        <section className="start">
          <h1 className="title">Color Game</h1>
          <p className="byline">Made by Spencer Boggs</p>
          <p className="score">High score {best ? `- level ${best}` : 'level 0'}</p>
          <button type="button" className="play" onClick={begin}>
            Play
          </button>
        </section>
      </main>
    )
  }

  const paused = phase === 'over'
  const colors = {
    '--base': puzzle.base,
    '--odd': puzzle.oddColor,
  } as CSSProperties

  return (
    <main className="app">
      <header className="hud">
        <h1>Level {puzzle.level}</h1>
        {phase === 'playing' ? (
          <>
            <Countdown key={puzzle.id} seconds={puzzle.seconds} penalty={penalty} onExpire={expire} />
            {/* <button type="button" className="skip" onClick={skip}>
              Skip to {skipTarget}
            </button> */}
          </>
        ) : (
          <div className="result">
            <span className="result-label">Out of time</span>
            <button type="button" className="play is-small is-ghost" onClick={menu}>
              Main menu
            </button>
            <button type="button" className="play is-small" onClick={begin}>
              Play again
            </button>
          </div>
        )}
      </header>

      <section className="stage">
        {puzzle.sliding ? (
          <div
            className="board is-sliding"
            key={puzzle.id}
            style={{ ...colors, '--columns': puzzle.columns, '--rows': puzzle.rows } as CSSProperties}
          >
            {Array.from({ length: puzzle.rows }, (_, row) => {
              const rowTiles = Array.from({ length: puzzle.columns }, (_, column) => row * puzzle.columns + column)
              return (
                <div
                  key={row}
                  className={row % 2 === 0 ? 'strip is-left' : 'strip is-right'}
                  style={{ animationPlayState: paused ? 'paused' : undefined }}
                >
                  {[...rowTiles, ...rowTiles].map((index, copy) => (
                    <Tile
                      key={`${copy}-${index}`}
                      index={index}
                      odd={index === puzzle.odd}
                      revealed={paused && index === puzzle.odd}
                      motion={puzzle.tiles[index]}
                      quirks={puzzle.quirks}
                      paused={paused}
                      onPick={pick}
                    />
                  ))}
                </div>
              )
            })}
          </div>
        ) : (
          <div
            className="board"
            key={puzzle.id}
            style={
              {
                ...colors,
                '--columns': puzzle.columns,
                '--rows': puzzle.rows,
                gridTemplateColumns: puzzle.columnTemplate,
                gridTemplateRows: puzzle.rowTemplate,
              } as CSSProperties
            }
          >
            {Array.from({ length: puzzle.columns * puzzle.rows }, (_, index) => (
              <Tile
                key={index}
                index={index}
                odd={index === puzzle.odd}
                revealed={paused && index === puzzle.odd}
                motion={puzzle.tiles[index]}
                quirks={puzzle.quirks}
                paused={paused}
                onPick={pick}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
