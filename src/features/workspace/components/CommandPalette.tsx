import { useEffect, useMemo, useState } from 'react'
import { useGraphDispatch, useGraphState } from '../../graph/state/useGraphStore'
import { useI18n } from '../../../shared/context/I18nContext'
import { toDOT } from '../utils/exportFormats'

type LocaleText = {
  en: string
  fr: string
}

interface Command {
  id: string
  name: LocaleText
  description: LocaleText
  shortcut?: string
  action: () => void
}

export function CommandPalette() {
  const dispatch = useGraphDispatch()
  const { graph } = useGraphState()
  const { locale, t } = useI18n()

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const formatLocaleText = (text: LocaleText) => {
    return locale === 'fr' ? `${text.fr}` : `${text.en}`
  }

  const matchesQuery = (text: LocaleText, normalizedQuery: string) => {
    return [text.en, text.fr].some((value) => value.toLowerCase().includes(normalizedQuery))
  }

  const commands: Command[] = useMemo(
    () => [
      {
        id: 'add-5-nodes',
        name: { en: 'Add 5 nodes', fr: 'Ajouter 5 nœuds' },
        description: {
          en: 'Add five nodes near the center',
          fr: 'Ajouter cinq nœuds près du centre',
        },
        action: () => {
          const baseX = 350
          const baseY = 220
          for (let i = 0; i < 5; i += 1) {
            dispatch({
              type: 'ADD_NODE',
              payload: {
                position: {
                  x: baseX + (i % 3) * 70,
                  y: baseY + Math.floor(i / 3) * 70,
                },
              },
            })
          }
        },
      },
      {
        id: 'toggle-directed',
        name: { en: 'Toggle directed', fr: 'Activer / désactiver l’orientation' },
        description: {
          en: 'Switch directed mode on/off',
          fr: 'Basculer le mode orienté',
        },
        action: () => dispatch({ type: 'SET_DIRECTED', payload: { directed: !graph.directed } }),
      },
      {
        id: 'toggle-weighted',
        name: { en: 'Toggle weighted', fr: 'Activer / désactiver les poids' },
        description: {
          en: 'Switch weighted mode on/off',
          fr: 'Basculer le mode pondéré',
        },
        action: () => dispatch({ type: 'SET_WEIGHTED', payload: { weighted: !graph.weighted } }),
      },
      {
        id: 'set-all-weights-5',
        name: { en: 'Set all weights to 5', fr: 'Mettre tous les poids à 5' },
        description: {
          en: 'Set every edge weight to 5',
          fr: 'Définir le poids de chaque arête à 5',
        },
        action: () => {
          if (!graph.weighted) {
            dispatch({ type: 'SET_WEIGHTED', payload: { weighted: true } })
          }
          for (const edge of graph.edges) {
            dispatch({ type: 'SET_EDGE_WEIGHT', payload: { edgeId: edge.id, weight: 5 } })
          }
        },
      },
      {
        id: 'auto-layout',
        name: { en: 'Run auto layout', fr: 'Lancer le placement automatique' },
        description: {
          en: 'Start force-directed layout animation',
          fr: 'Démarrer l’animation de placement par forces',
        },
        action: () => window.dispatchEvent(new CustomEvent('graph:auto-layout')),
      },
      {
        id: 'run-bfs',
        name: { en: 'Run BFS from first node', fr: 'Lancer BFS depuis le premier nœud' },
        description: {
          en: 'Generate cinema steps and start playback from first node',
          fr: 'Générer les étapes cinéma et démarrer la lecture depuis le premier nœud',
        },
        action: () => {
          if (graph.nodes.length === 0) {
            return
          }
          window.dispatchEvent(
            new CustomEvent('graph:run-cinema', {
              detail: {
                algorithm: 'BFS',
                source: graph.nodes[0],
                target: graph.nodes[1] ?? graph.nodes[0],
              },
            }),
          )
        },
      },
      {
        id: 'copy-dot',
        name: { en: 'Copy DOT export', fr: 'Copier l’export DOT' },
        description: {
          en: 'Copy Graphviz DOT representation to clipboard',
          fr: 'Copier la représentation Graphviz DOT dans le presse-papiers',
        },
        action: () => {
          void navigator.clipboard.writeText(toDOT(graph))
        },
      },
      {
        id: 'reset-graph',
        name: { en: 'Reset graph', fr: 'Réinitialiser le graphe' },
        description: {
          en: 'Clear everything and reset defaults',
          fr: 'Tout effacer et rétablir les paramètres par défaut',
        },
        action: () => dispatch({ type: 'RESET' }),
      },
    ],
    [dispatch, graph],
  )

  const filteredCommands = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) {
      return commands
    }
    return commands.filter(
      (command) =>
        matchesQuery(command.name, normalized) || matchesQuery(command.description, normalized),
    )
  }, [commands, query])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (
        !open &&
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '')
      ) {
        return
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        if (open) {
          setOpen(false)
          setQuery('')
          setSelectedIndex(0)
        } else {
          setOpen(true)
          setSelectedIndex(0)
        }
        return
      }

      if (!open) {
        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        setQuery('')
        setSelectedIndex(0)
        return
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setSelectedIndex((index) => Math.min(filteredCommands.length - 1, index + 1))
        return
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setSelectedIndex((index) => Math.max(0, index - 1))
        return
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        const command = filteredCommands[selectedIndex]
        if (!command) {
          return
        }
        command.action()
        setOpen(false)
        setQuery('')
        setSelectedIndex(0)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [filteredCommands, open, selectedIndex])

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh] backdrop-blur-sm" style={{ backgroundColor: 'rgba(15, 23, 42, 0.35)' }}>
      <div
        className="w-full max-w-2xl rounded-xl border shadow-[0_0_40px_rgba(99,102,241,0.25)]"
        style={{ backgroundColor: 'var(--app-surface-strong)', borderColor: 'var(--app-border)' }}
      >
        <div className="border-b p-3" style={{ borderColor: 'var(--app-border)' }}>
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            className="glass-input w-full px-3 py-2 text-sm"
            placeholder={t('palette.placeholder')}
          />
        </div>

        <ul className="max-h-[360px] overflow-auto p-2">
          {filteredCommands.length === 0 && (
            <li className="rounded-md px-3 py-2 text-sm " style={{color : 'var(--app-text)'}}>{t('palette.noMatch')}</li>
          )}

          {filteredCommands.map((command, index) => {
            const selected = index === selectedIndex
            return (
              <li key={command.id}>
                <button
                  type="button"
                  className={`w-full rounded-md px-3 py-2 text-left transition-colors ${selected ? 'bg-indigo-500/20' : 'text-slate-200 hover:bg-slate-800/80'}`}
                  style={{color : 'var(--app-text)'}}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => {
                    command.action()
                    setOpen(false)
                    setQuery('')
                    setSelectedIndex(0)
                  }}
                >
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">{formatLocaleText(command.name)}</span>
                    {command.shortcut && <span className="text-xs" style={{color : 'var(--app-text)'}}>{command.shortcut}</span>}
                  </div>
                  <p className="mt-0.5 text-xs" style={{color : 'var(--app-text)'}}>{formatLocaleText(command.description)}</p>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}


