import type { ReactNode } from 'react'

interface FieldProps {
  label: string
  children: ReactNode
  hint?: string
}

export function Field({ label, children, hint }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="label">{label}</label>
      {children}
      {hint && <p className="text-xs text-white/30">{hint}</p>}
    </div>
  )
}

interface SliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  leftLabel?: string
  rightLabel?: string
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  leftLabel,
  rightLabel,
}: SliderProps) {
  return (
    <div className="space-y-1">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-brand-500"
      />
      <div className="flex justify-between text-xs text-white/30">
        <span>{leftLabel ?? min}</span>
        <span className="text-white/60 font-medium">{value}</span>
        <span>{rightLabel ?? max}</span>
      </div>
    </div>
  )
}

interface TagsProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
}

export function Tags({ value, onChange, placeholder }: TagsProps) {
  return (
    <textarea
      value={value.join('\n')}
      onChange={(e) =>
        onChange(
          e.target.value
            .split('\n')
            .map((v) => v.trim())
            .filter(Boolean)
        )
      }
      placeholder={placeholder ?? 'Uno por línea'}
      rows={3}
      className="input resize-none font-mono text-xs"
    />
  )
}
