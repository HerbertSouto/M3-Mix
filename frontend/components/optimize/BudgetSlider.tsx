'use client'
import { Slider } from '@/components/ui/slider'

interface Props {
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}

export function BudgetSlider({ value, min, max, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Budget total</span>
        <span className="font-semibold">
          ${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
        </span>
      </div>
      <Slider
        value={value}
        min={min}
        max={max}
        step={Math.round((max - min) / 100)}
        onValueChange={(v) => {
          const num = Array.isArray(v) ? v[0] : v
          if (typeof num === 'number') onChange(num)
        }}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>${min.toLocaleString('en-US')}</span>
        <span>${max.toLocaleString('en-US')}</span>
      </div>
    </div>
  )
}
