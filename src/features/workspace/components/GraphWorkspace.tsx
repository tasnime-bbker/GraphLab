import { Badge, Container, Group, Paper, Stack, Text, Title } from '@mantine/core'
import { GraphCanvas } from '../../graph-editor/components/GraphCanvas'
import { useGraphState } from '../../graph/state/useGraphStore'
import { MatrixEditor } from '../../matrix/components/MatrixEditor'
import { useI18n } from '../../../shared/context/I18nContext'
import { CommandPalette } from './CommandPalette'
import { GraphContractPanel } from './GraphContractPanel'
import { GraphHistoryTimeline } from './GraphHistoryTimeline'
import { ModeSwitch } from './ModeSwitch'
import { TopRightParameters } from './TopRightParameters'

export function GraphWorkspace() {
  const { mode, isDevMode } = useGraphState()
  const { t } = useI18n()

  return (
    <main className="min-h-screen py-8 relative">
      <Container size="xl" px="md">
        <Stack gap="lg">
          <Group justify="space-between" align="flex-start">
            <div>
              <Title order={1}>{t('app.title')}</Title>
              <Text c="dimmed" size="sm">
                {t('app.subtitle')}
              </Text>
            </div>
            <Badge color="indigo" variant="light">
              Mantine UI
            </Badge>
          </Group>

          <div>
            <ModeSwitch />
          </div>

          <GraphHistoryTimeline />

          <div className={`grid grid-cols-1 gap-6 transition-all duration-500 ${isDevMode ? 'xl:grid-cols-[1fr_400px]' : 'xl:grid-cols-1'}`}>
            <Paper withBorder radius="md" className="relative overflow-hidden p-1 min-h-[600px]">
              {mode === 'visual' ? <GraphCanvas /> : <MatrixEditor />}
            </Paper>
            {isDevMode && (
              <div className="flex flex-col animate-in fade-in slide-in-from-right-4 duration-500 overflow-hidden">
                <GraphContractPanel />
              </div>
            )}
          </div>
        </Stack>
      </Container>
      <TopRightParameters />
      <CommandPalette />
    </main>
  )
}
