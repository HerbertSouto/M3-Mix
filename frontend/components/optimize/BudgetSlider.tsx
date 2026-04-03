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
        defaultValue={[value]}
        min={min}
        max={max}
        step={Math.max(1, Math.round((max - min) / 100))}
        onValueChange={(v) => {
          if (typeof v[0] === 'number') onChange(v[0])
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
