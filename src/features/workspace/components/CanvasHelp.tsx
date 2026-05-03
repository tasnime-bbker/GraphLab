import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { ActionIcon, Tooltip } from '@mantine/core'
import { useI18n } from '../../../shared/context/I18nContext'

export function CanvasHelp() {
  const { t } = useI18n()
  const [opened, setOpened] = useState(false)

  const ShortcutItem = ({ keys, description }: { keys: string[], description: string }) => (
    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-800/80 hover:border-blue-500/30 transition-colors">
      <span className="text-sm font-medium text-slate-300">{description}</span>
      <div className="flex items-center gap-2">
        {keys.map((k, idx) => (
          <React.Fragment key={idx}>
            <kbd className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-mono text-blue-400 font-bold shadow-sm whitespace-nowrap">
              {k}
            </kbd>
            {idx < keys.length - 1 && <span className="text-slate-600 text-xs font-bold">+</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  )

  const MouseItem = ({ icon, description }: { icon: React.ReactNode, description: string }) => (
    <div className="flex items-center gap-4 p-3.5 rounded-lg bg-slate-900/50 border border-slate-800/80 hover:border-emerald-500/30 transition-colors">
      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-md bg-slate-800 text-emerald-400 shadow-sm border border-slate-700">
        {icon}
      </div>
      <span className="text-sm font-medium text-slate-300">{description}</span>
    </div>
  )

  return (
    <>
      <Tooltip label={t('help.title')} position="bottom" withArrow>
        <ActionIcon 
          variant="light" 
          color="blue" 
          radius="xl" 
          size="lg" 
          className="transition-all duration-300 hover:scale-110 hover:bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.3)] bg-slate-900/80 border border-blue-500/30 backdrop-blur-sm"
          onClick={() => setOpened(true)}
          aria-label="Aide"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </ActionIcon>
      </Tooltip>

      {opened && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 md:p-6 animate-in fade-in duration-300">
          <div className="relative w-full max-w-3xl rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.15)] border border-slate-700/80 bg-slate-900 animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="relative px-6 py-5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-wide">GraphLab <span className="text-blue-400">Guide</span></h2>
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mt-1">{t('help.summary')}</p>
                </div>
              </div>
              
              <button 
                onClick={() => setOpened(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-rose-500 transition-colors cursor-pointer"
                title="Fermer le guide"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-950/50 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Mouse Column */}
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase text-emerald-400 tracking-widest flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  {t('help.mouse.title')}
                </h3>
                <div className="space-y-3">
                  <MouseItem 
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>}
                    description={t('help.mouse.leftClick')}
                  />
                  <MouseItem 
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>}
                    description={t('help.mouse.drag')}
                  />
                  <MouseItem 
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>}
                    description={t('help.mouse.rightDrag')}
                  />
                  <MouseItem 
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>}
                    description={t('help.mouse.wheel')}
                  />
                </div>
              </div>

              {/* Keyboard Column */}
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase text-purple-400 tracking-widest flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                  {t('help.shortcuts.title')}
                </h3>
                <div className="space-y-3">
                  <ShortcutItem keys={[t('lang.fr') === 'Français' ? 'Suppr' : 'Del', t('lang.fr') === 'Français' ? 'Retour Arr.' : 'Backspace']} description={t('help.shortcuts.delete')} />
                  <ShortcutItem keys={["Esc"]} description={t('help.shortcuts.escape')} />
                  <ShortcutItem keys={["Space", "Left Click"]} description={t('help.shortcuts.pan')} />
                  <ShortcutItem keys={["Ctrl", "Z"]} description={t('help.shortcuts.undo')} />
                  <ShortcutItem keys={["Ctrl", "Y"]} description={t('help.shortcuts.redo')} />
                </div>
              </div>
            </div>

            {/* Footer / Tip */}
            <div className="bg-blue-500/10 border-t border-blue-500/20 p-5 flex items-start gap-4">
              <svg className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p className="text-sm text-blue-200/90 leading-relaxed font-medium">
                <strong className="text-blue-300">{t('help.tip.title')}</strong> {t('help.tip.text')}
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}


