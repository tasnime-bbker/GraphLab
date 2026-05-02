import { useEffect, useMemo, useState } from 'react'
import { useGraphDispatch, useGraphState } from '../../graph/state/useGraphStore'
import { useI18n } from '../../../shared/context/I18nContext'
import { toDOT } from '../utils/exportFormats'

interface Command {
  id: string
  name: string
  description: string
  shortcut?: string
  action: () => void
}

export function CommandPalette() {
  const dispatch = useGraphDispatch()
  const { graph } = useGraphState()
  const { t } = useI18n()

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const commands: Command[] = useMemo(
    () => [
      {
        id: 'add-5-nodes',
        name: 'Add 5 nodes',
        description: 'Add five nodes near the center',
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
        name: 'Toggle directed',
        description: 'Switch directed mode on/off',
        action: () => dispatch({ type: 'SET_DIRECTED', payload: { directed: !graph.directed } }),
      },
      {
        id: 'toggle-weighted',
        name: 'Toggle weighted',
        description: 'Switch weighted mode on/off',
        action: () => dispatch({ type: 'SET_WEIGHTED', payload: { weighted: !graph.weighted } }),
      },
      {
        id: 'set-all-weights-5',
        name: 'Set all weights to 5',
        description: 'Set every edge weight to 5',
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
        name: 'Run auto layout',
        description: 'Start force-directed layout animation',
        action: () => window.dispatchEvent(new CustomEvent('graph:auto-layout')),
      },
      {
        id: 'run-bfs',
        name: 'Run BFS from first node',
        description: 'Generate cinema steps and start playback from first node',
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
        name: 'Copy DOT export',
        description: 'Copy Graphviz DOT representation to clipboard',
        action: () => {
          void navigator.clipboard.writeText(toDOT(graph))
        },
      },
      {
        id: 'reset-graph',
        name: 'Reset graph',
        description: 'Clear everything and reset defaults',
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
        command.name.toLowerCase().includes(normalized) ||
        command.description.toLowerCase().includes(normalized),
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
            <li className="rounded-md px-3 py-2 text-sm text-slate-400">{t('palette.noMatch')}</li>
          )}

          {filteredCommands.map((command, index) => {
            const selected = index === selectedIndex
            return (
              <li key={command.id}>
                <button
                  type="button"
                  className={`w-full rounded-md px-3 py-2 text-left transition-colors ${selected ? 'bg-indigo-500/20 text-white' : 'text-slate-200 hover:bg-slate-800/80'}`}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => {
                    command.action()
                    setOpen(false)
                    setQuery('')
                    setSelectedIndex(0)
                  }}
                >
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">{command.name}</span>
                    {command.shortcut && <span className="text-xs text-slate-400">{command.shortcut}</span>}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">{command.description}</p>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}


