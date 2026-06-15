import { useState } from 'react'
import { HexColorPicker } from 'react-colorful'

export function ColorPicker({ color, onChange }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-10 h-10 rounded-xl border-2 border-gray-200 shadow-sm cursor-pointer transition-transform hover:scale-105"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm font-mono text-gray-500">{color}</span>
      </div>
      {open && (
        <div className="absolute top-12 right-0 z-50 bg-white p-3 rounded-xl shadow-xl border border-gray-200 animate-fade-in">
          <HexColorPicker color={color} onChange={onChange} />
        </div>
      )}
    </div>
  )
}
