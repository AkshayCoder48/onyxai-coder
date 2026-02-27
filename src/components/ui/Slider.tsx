import { cn } from '../../lib/utils'

interface SliderProps {
  label?: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step: number
  className?: string
  hint?: string
}

export function Slider({ label, value, onChange, min, max, step, className, hint }: SliderProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300">{label}</label>
          <span className="text-sm text-onyx-400 font-mono">{value}</span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-onyx-500"
      />
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  )
}
