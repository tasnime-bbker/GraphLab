import { Button, Code, Group, Paper, Select, Stack, Text, Textarea } from '@mantine/core'
import { useMemo, useState, useEffect } from 'react'
import { useGraphState, useGraphDispatch } from '../../graph/state/useGraphStore'
import { useI18n } from '../../../shared/context/I18nContext'
import { formatGraphForExport, type ExportFormat, svgToPngBlob } from '../utils/exportFormats'
import { parseGraph } from '../utils/importFormats'

export function GraphContractPanel() {
  const { graph } = useGraphState()
  const dispatch = useGraphDispatch()
  const { t } = useI18n()
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json')
  const [copyState, setCopyState] = useState<'idle' | 'done' | 'error'>('idle')
  
  const [isEditing, setIsEditing] = useState(false)
  const [draftText, setDraftText] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const exportText = useMemo(() => formatGraphForExport(graph, exportFormat), [exportFormat, graph])

  useEffect(() => {
    if (!isEditing) {
      setDraftText(exportText)
      setErrorMsg(null)
    }
  }, [exportText, isEditing])

  const canEdit = exportFormat === 'json' || exportFormat === 'adjacency' || exportFormat === 'edgelist'

  function handleApply() {
    try {
      const newGraph = parseGraph(draftText, exportFormat, graph)
      dispatch({ type: 'SET_GRAPH_STATE', payload: { graph: newGraph } })
      setIsEditing(false)
      setErrorMsg(null)
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to parse input')
    }
  }

  async function copyExport() {
    try {
      await navigator.clipboard.writeText(exportText)
      setCopyState('done')
    } catch {
      setCopyState('error')
    }
    window.setTimeout(() => setCopyState('idle'), 1200)
  }

  async function exportPng() {
    const svg = document.querySelector('[data-graph-canvas="main"]') as SVGSVGElement | null
    if (!svg) return
    const blob = await svgToPngBlob(svg)
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'graph-lab.png'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function escapeHtml(s: string) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }

  function highlightJson(jsonText: string) {
    const escaped = escapeHtml(jsonText)
    return escaped.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, function (match) {
      let cls = 'text-blue-500'
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'text-sky-400'
        } else {
          cls = 'text-emerald-500'
        }
      }
      return `<span class=\"${cls}\">${match}</span>`
    })
  }

  const previewHtml = exportFormat === 'json' ? highlightJson(exportText) : null

  return (
    <Paper withBorder p="md" radius="md" className="flex flex-col h-full overflow-hidden">
      <Stack gap="sm" className="flex-1">
        <Group justify="space-between" align="center">
          <div>
            <Text fw={600}>{t('contract.title')}</Text>
            <Text size="xs" c="dimmed">
              {t('contract.subtitle')}
            </Text>
          </div>
          <Group gap="xs">
            <button className="btn-premium" onClick={() => void copyExport()}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              {copyState === 'done' ? t('toolbar.copied') : copyState === 'error' ? t('toolbar.copyFailed') : t('toolbar.copy')}
            </button>
            <button className="btn-premium" onClick={() => void exportPng()}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {t('toolbar.png')}
            </button>
          </Group>
        </Group>
        <Group justify="space-between" align="flex-end">
          <Select
            w="200px"
            size="xs"
            label={t('toolbar.format')}
            value={exportFormat}
            onChange={(value) => {
              if (value) {
                setExportFormat(value as ExportFormat)
                setIsEditing(false)
              }
            }}
            data={[
              { value: 'json', label: 'JSON' },
              { value: 'adjacency', label: 'Adjacency List' },
              { value: 'edgelist', label: 'Edge List' },
              { value: 'dot', label: 'DOT' },
              { value: 'tikz', label: 'LaTeX TikZ' },
            ]}
          />
          {canEdit && (
            <Group gap="xs">
              {isEditing ? (
                <>
                  <button className="btn-premium !bg-blue-700 hover:!bg-blue-600" onClick={handleApply}>
                    Apply Changes
                  </button>
                  <button className="btn-premium !bg-slate-600 hover:!bg-slate-500" onClick={() => setIsEditing(false)}>
                    Cancel
                  </button>
                </>
              ) : (
                <button className="btn-premium" onClick={() => { setDraftText(exportText); setIsEditing(true); }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Code
                </button>
              )}
            </Group>
          )}
        </Group>

        {errorMsg && (
          <div className="rounded border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
            {errorMsg}
          </div>
        )}

        <div style={{ height: 1050, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {isEditing ? (
            <Textarea
              value={draftText}
              onChange={(e) => setDraftText(e.currentTarget.value)}
              className="flex-1"
              styles={{
                input: {
                  height: '100%',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  backgroundColor: 'var(--app-surface-strong)',
                  color: 'var(--app-text)',
                  borderColor: 'var(--app-border)',
                },
                wrapper: { height: '100%' }
              }}
            />
          ) : previewHtml ? (
            <pre
              className="p-4 rounded-xl border flex-1"
              style={{
                borderColor: 'var(--app-border)',
                backgroundColor: 'var(--app-surface-strong)',
                color: 'var(--app-text)',
                overflow: 'auto',
                margin: 0,
                fontSize: '13px',
                fontFamily: 'monospace'
              }}
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          ) : (
            <Code
              block
              className="flex-1"
              style={{
                display: 'block',
                padding: 12,
                overflow: 'auto',
                margin: 0,
                fontSize: '13px'
              }}
            >
              {exportText}
            </Code>
          )}
        </div>
      </Stack>
    </Paper>
  )
}
