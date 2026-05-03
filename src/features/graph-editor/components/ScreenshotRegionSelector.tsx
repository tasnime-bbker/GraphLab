import React, { useState } from 'react'

export interface RegionRect {
  x: number
  y: number
  width: number
  height: number
}

interface ScreenshotRegionSelectorProps {
  onSelect: (rect: RegionRect) => void
  onCancel: () => void
}

export const ScreenshotRegionSelector: React.FC<ScreenshotRegionSelectorProps> = ({ onSelect, onCancel }) => {
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null)
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return // Only left click
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setStartPos({ x, y })
    setCurrentPos({ x, y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!startPos) return
    const rect = e.currentTarget.getBoundingClientRect()
    let x = e.clientX - rect.left
    let y = e.clientY - rect.top
    
    x = Math.max(0, Math.min(x, rect.width))
    y = Math.max(0, Math.min(y, rect.height))
    
    setCurrentPos({ x, y })
  }

  const handleMouseUp = () => {
    if (!startPos || !currentPos) {
      onCancel()
      return
    }

    const x = Math.min(startPos.x, currentPos.x)
    const y = Math.min(startPos.y, currentPos.y)
    const width = Math.abs(currentPos.x - startPos.x)
    const height = Math.abs(currentPos.y - startPos.y)

    if (width > 20 && height > 20) {
      onSelect({ x, y, width, height })
    } else {
      onCancel()
    }
  }

  return (
    <div
      className="absolute inset-0 z-[9999] cursor-crosshair select-none overflow-hidden"
      style={{ backgroundColor: startPos ? 'transparent' : 'rgba(0, 0, 0, 0.2)' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={(e) => {
        e.preventDefault()
        onCancel()
      }}
    >
      {!startPos && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-xl shadow-2xl text-sm font-semibold animate-pulse pointer-events-none border border-slate-600">
          Click and drag to select an area (Right-click to cancel)
        </div>
      )}
      
      {startPos && currentPos && (
        <div
          className="absolute border-2 border-sky-400 bg-sky-400/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
          style={{
            left: Math.min(startPos.x, currentPos.x),
            top: Math.min(startPos.y, currentPos.y),
            width: Math.abs(currentPos.x - startPos.x),
            height: Math.abs(currentPos.y - startPos.y),
          }}
        />
      )}
    </div>
  )
}
