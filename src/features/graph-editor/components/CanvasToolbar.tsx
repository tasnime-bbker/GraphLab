import React, { useState, useEffect, useRef } from 'react'
import { useI18n } from '../../../shared/context/I18nContext'
import './CanvasToolbar.css'

interface CanvasToolbarProps {
  onAddNode: () => void
  onDeleteSelected: () => void
  onUndo: () => void
  onRedo: () => void
  onFindNode: (id: string) => void
  onScreenshot: () => void
  onResetView: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onOpenCommandPalette: () => void
  canUndo: boolean
  canRedo: boolean
  hasSelection: boolean
  isCommandPaletteOpen: boolean
  zoomLevel: number
  onExportJson?: () => void
  onCopyAdjList?: () => void
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  onAddNode,
  onDeleteSelected,
  onUndo,
  onRedo,
  onFindNode,
  onScreenshot,
  onResetView,
  onZoomIn,
  onZoomOut,
  onOpenCommandPalette,
  canUndo,
  canRedo,
  hasSelection,
  isCommandPaletteOpen,
  zoomLevel,
  onExportJson,
  onCopyAdjList,
}) => {
  const { t } = useI18n()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [searchError, setSearchError] = useState(false)
  const [isSpinning, setIsSpinning] = useState(false)
  const [isShutterActive, setIsShutterActive] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const zoomPercent = Math.round(zoomLevel * 100)

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchOpen])

  useEffect(() => {
    const onClose = () => setIsSearchOpen(false)
    window.addEventListener('toolbar:close-search', onClose)
    return () => window.removeEventListener('toolbar:close-search', onClose)
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchValue.trim()) {
      onFindNode(searchValue.trim())
      setIsSearchOpen(false)
      setSearchValue('')
    }
  }

  const triggerReset = () => {
    setIsSpinning(true)
    onResetView()
    setTimeout(() => setIsSpinning(false), 400)
  }

  const triggerScreenshot = () => {
    setIsShutterActive(true)
    onScreenshot()
    setTimeout(() => setIsShutterActive(false), 120)
  }

  return (
    <>
      <div className={`shutter-overlay ${isShutterActive ? 'active' : ''}`} />
      
      {isSearchOpen && (
        <div className={`toolbar-search-container ${searchError ? 'error' : ''}`}>
          <form onSubmit={handleSearchSubmit}>
            <input
              ref={searchInputRef}
              className="toolbar-search-input"
              placeholder={t('toolbar.searchPlaceholder')}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsSearchOpen(false)
              }}
              onBlur={() => setIsSearchOpen(false)}
            />
          </form>
        </div>
      )}

      <div className="canvas-toolbar-container">
        {/* GROUP 1 — Search & Command */}
        <button
          className={`toolbar-btn ${isSearchOpen ? 'active' : ''}`}
          data-tooltip={t('toolbar.tooltip.findNode')}
          onClick={() => setIsSearchOpen(!isSearchOpen)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
        <button
          className={`toolbar-btn ${isCommandPaletteOpen ? 'active' : ''}`}
          data-tooltip={t('toolbar.tooltip.commandPalette')}
          onClick={onOpenCommandPalette}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" y1="19" x2="20" y2="19" />
          </svg>
        </button>

        <div className="toolbar-divider" />

        {/* GROUP 2 — History */}
        <button
          className="toolbar-btn"
          data-tooltip={t('toolbar.tooltip.undo')}
          onClick={onUndo}
          disabled={!canUndo}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        </button>
        <button
          className="toolbar-btn"
          data-tooltip={t('toolbar.tooltip.redo')}
          onClick={onRedo}
          disabled={!canRedo}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
          </svg>
        </button>

        <div className="toolbar-divider" />

        {/* GROUP 3 — Zoom */}
        <button
          className="toolbar-btn"
          data-tooltip={t('toolbar.tooltip.zoomOut')}
          onClick={onZoomOut}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </button>
        <div 
          className="zoom-indicator" 
          onClick={onResetView}
          key={zoomPercent}
        >
          {zoomPercent}%
        </div>
        <button
          className="toolbar-btn"
          data-tooltip={t('toolbar.tooltip.zoomIn')}
          onClick={onZoomIn}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </button>

        <div className="toolbar-divider" />

        {/* GROUP 4 — Canvas Actions */}
        <button
          className={`toolbar-btn ${isSpinning ? 'spin-animation' : ''}`}
          data-tooltip={t('toolbar.tooltip.resetView')}
          onClick={triggerReset}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>
        <button
          className="toolbar-btn"
          data-tooltip={t('toolbar.tooltip.addNode')}
          onClick={onAddNode}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </button>
        <button
          className="toolbar-btn danger"
          data-tooltip={t('toolbar.tooltip.deleteSelected')}
          onClick={onDeleteSelected}
          disabled={!hasSelection}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </button>

        <div className="toolbar-divider" />

        {/* GROUP 5 — Utilities */}
        <button
          className="toolbar-btn"
          data-tooltip={t('toolbar.tooltip.screenshot')}
          onClick={triggerScreenshot}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </button>

        {onExportJson && (
          <button
            className="toolbar-btn"
            data-tooltip={t('toolbar.tooltip.copyJson')}
            onClick={onExportJson}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              <path d="M9 14l2 2 4-4" />
            </svg>
          </button>
        )}

        {onCopyAdjList && (
          <button
            className="toolbar-btn"
            data-tooltip={t('toolbar.tooltip.copyAdjList')}
            onClick={onCopyAdjList}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <line x1="8" y1="6" x2="21" y2="6" />
               <line x1="8" y1="12" x2="21" y2="12" />
               <line x1="8" y1="18" x2="21" y2="18" />
               <line x1="3" y1="6" x2="3.01" y2="6" />
               <line x1="3" y1="12" x2="3.01" y2="12" />
               <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </>
  )
}
