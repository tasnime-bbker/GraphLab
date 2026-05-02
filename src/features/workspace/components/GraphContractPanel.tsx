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
      let cls = 'text-indigo-500'
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'text-violet-400'
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
            <Button size="xs" variant="light" onClick={() => void copyExport()}>
              {copyState === 'done' ? t('toolbar.copied') : copyState === 'error' ? t('toolbar.copyFailed') : t('toolbar.copy')}
            </Button>
            <Button size="xs" variant="light" onClick={() => void exportPng()}>
              {t('toolbar.png')}
            </Button>
          </Group>
        </Group>
        <Group align="stretch" gap="xs">
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
          <div style={{ flex: 1, minHeight: 500, overflow: 'auto' }}>
            {previewHtml ? (
              <pre
                className="p-4 rounded-xl border"
                style={{ borderColor: 'var(--app-border)', backgroundColor: 'var(--app-surface-strong)', color: 'var(--app-text)', maxHeight: '700px', overflow: 'scroll' }}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <Code block style={{ display: 'block', minHeight: 500, padding: 12 }}>{exportText}</Code>
            )}
          </div>
        </Group>
      </Stack>
    </Paper>
  )
}
