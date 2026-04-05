import type { ClayColor } from './ClayButton'

interface ClaySliderProps {
  min: number
  max: number
  value: number
  onChange: (value: number) => void
  color?: ClayColor
  step?: number
  formatLabel?: (value: number) => string
  minLabel?: string
  maxLabel?: string
}

const TRACK_COLOR: Record<ClayColor, { fill: string; track: string }> = {
  blue:   { fill: '#5BCEFA', track: '#BDE8F5' },
  coral:  { fill: '#FF6B6B', track: '#FFBDBD' },
  lime:   { fill: '#A8E063', track: '#D3F0A2' },
  purple: { fill: '#C084FC', track: '#E4C2FE' },
  yellow: { fill: '#FFD93D', track: '#FFEEA0' },
  cream:  { fill: '#D4A96A', track: '#EDD6B2' },
}

export function ClaySlider({
  min,
  max,
  value,
  onChange,
  color = 'blue',
  step = 1,
  formatLabel,
  minLabel,
  maxLabel,
}: ClaySliderProps) {
  const colors = TRACK_COLOR[color]
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className="w-full select-none">
      {/* Track + thumb */}
      <div className="relative h-6 flex items-center">
        {/* Background track */}
        <div
          className="absolute w-full h-4 rounded-full"
          style={{
            background: colors.track,
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.12)',
          }}
        />
        {/* Filled portion */}
        <div
          className="absolute h-4 rounded-full transition-none"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${colors.fill}cc, ${colors.fill})`,
            boxShadow: `inset 0 2px 4px rgba(255,255,255,0.4)`,
          }}
        />
        {/* Native input — invisible but captures interaction */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute w-full opacity-0 cursor-pointer h-6"
          style={{ zIndex: 2 }}
        />
        {/* Custom thumb */}
        <div
          className="absolute w-7 h-7 rounded-full pointer-events-none"
          style={{
            left: `calc(${pct}% - 14px)`,
            background: `linear-gradient(160deg, #fff, ${colors.fill})`,
            boxShadow: `0 4px 0 0 ${colors.fill}99, inset 0 2px 4px rgba(255,255,255,0.7)`,
            zIndex: 1,
          }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-2 font-body text-sm font-semibold text-[#1A1A2E]/60">
        <span>{minLabel ?? min}</span>
        {formatLabel && (
          <span
            className="font-bold text-[#1A1A2E]"
            style={{ color: colors.fill }}
          >
            {formatLabel(value)}
          </span>
        )}
        <span>{maxLabel ?? max}</span>
      </div>
    </div>
  )
}

// ─── Left–Right labeled slider (for output ratio) ────────────────────────────

interface LabeledRangeSliderProps {
  value: number          // 0.0–1.0
  onChange: (v: number) => void
  leftLabel: string
  rightLabel: string
  color?: ClayColor
}

export function LabeledRangeSlider({
  value,
  onChange,
  leftLabel,
  rightLabel,
  color = 'blue',
}: LabeledRangeSliderProps) {
  return (
    <div className="w-full">
      <ClaySlider
        min={0}
        max={100}
        step={5}
        value={Math.round(value * 100)}
        onChange={v => onChange(v / 100)}
        color={color}
      />
      <div className="flex justify-between mt-1 font-body text-sm font-semibold text-[#1A1A2E]/50">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  )
}
