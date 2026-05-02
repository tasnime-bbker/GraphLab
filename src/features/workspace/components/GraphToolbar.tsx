import { Button, Group, Paper, Stack, Text } from '@mantine/core'
import { useGraphDispatch, useGraphState } from '../../graph/state/useGraphStore'
import { useI18n } from '../../../shared/context/I18nContext'

export function GraphToolbar() {
  const dispatch = useGraphDispatch()
  const { graph } = useGraphState()
  const { t } = useI18n()

  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Text fw={600} size="sm">
            {t('toolbar.title')}
          </Text>
            <Group gap="xs">
              <Button size="xs" variant="light" onClick={() => window.dispatchEvent(new CustomEvent('graph:auto-layout'))}>
                {t('params.autoLayout')}
              </Button>
              <Button size="xs" variant="light" color="red" onClick={() => dispatch({ type: 'RESET' })}>
                {t('toolbar.clear')}
              </Button>
            </Group>
        </Group>

        <Group gap="xs">
          <Text size="xs">{t('params.nodes')}: {graph.nodes.length}</Text>
          <Text size="xs">{t('params.edges')}: {graph.edges.length}</Text>
        </Group>
      </Stack>
    </Paper>
  )
}
