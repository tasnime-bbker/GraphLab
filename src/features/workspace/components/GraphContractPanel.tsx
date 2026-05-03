import { Button, Code, Group, Paper, Select, Stack, Text } from '@mantine/core'
import { useMemo, useState } from 'react'
import { useGraphState } from '../../graph/state/useGraphStore'
import { useI18n } from '../../../shared/context/I18nContext'
import { formatGraphForExport, type ExportFormat, svgToPngBlob } from '../utils/exportFormats'

export function GraphContractPanel() {
  const { graph } = useGraphState()
  const { t } = useI18n()
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json')
  const [copyState, setCopyState] = useState<'idle' | 'done' | 'error'>('idle')

  const exportText = useMemo(() => formatGraphForExport(graph, exportFormat), [exportFormat, graph])

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
        <Select
          w="100%"
          size="xs"
          label={t('toolbar.format')}
          value={exportFormat}
          onChange={(value) => value && setExportFormat(value as ExportFormat)}
          data={[
            { value: 'json', label: 'JSON' },
            { value: 'adjacency', label: 'Adjacency List' },
            { value: 'edgelist', label: 'Edge List' },
            { value: 'dot', label: 'DOT' },
            { value: 'tikz', label: 'LaTeX TikZ' },
          ]}
        />
        <div style={{ height: 1050, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {previewHtml ? (
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
