import {
  Affix,
  Divider,
  Group,
  Paper,
  Select,
  Stack,
  Switch,
  Text,
} from '@mantine/core'
import { useGraphDispatch, useGraphState } from '../../graph/state/useGraphStore'
import { useAppTheme } from '../../../shared/context/AppThemeContext'
import { useI18n, type Locale } from '../../../shared/context/I18nContext'

export function TopRightParameters() {
  const dispatch = useGraphDispatch()
  const { graph, isDevMode } = useGraphState()
  const { colorScheme, toggleColorScheme } = useAppTheme()
  const { locale, setLocale, t } = useI18n()

  return (
    <Affix position={{ top: 16, right: 16 }} zIndex={50}>
      <Paper shadow="md" radius="md" p="sm" withBorder maw={260}>
        <Stack gap="xs">
          <Text fw={600} size="sm">
            {t('params.title')}
          </Text>

          <Switch
            size="sm"
            label={t('params.directed')}
            checked={graph.directed}
            onChange={(event) =>
              dispatch({
                type: 'SET_DIRECTED',
                payload: { directed: event.currentTarget.checked },
              })
            }
          />

          <Switch
            size="sm"
            label={t('params.weighted')}
            checked={graph.weighted}
            onChange={(event) =>
              dispatch({
                type: 'SET_WEIGHTED',
                payload: { weighted: event.currentTarget.checked },
              })
            }
          />

          <Select
            size="xs"
            label={t('params.weightPolicy')}
            value={graph.weightPolicy}
            disabled={!graph.weighted}
            onChange={(value) => {
              if (!value) {
                return
              }
              dispatch({
                type: 'SET_WEIGHT_POLICY',
                payload: { policy: value as typeof graph.weightPolicy },
              })
            }}
            data={[
              { value: 'positive', label: t('policy.positive') },
              { value: 'nonNegative', label: t('policy.nonNegative') },
              { value: 'any', label: t('policy.any') },
            ]}
          />

          <Switch
            size="sm"
            label={t('params.devMode')}
            checked={isDevMode}
            onChange={(event) =>
              dispatch({ type: 'SET_DEV_MODE', payload: { isDevMode: event.currentTarget.checked } })
            }
          />

          <Switch
            size="sm"
            label={t('params.darkMode')}
            checked={colorScheme === 'dark'}
            onChange={toggleColorScheme}
          />

          <Select
            size="xs"
            label={t('params.language')}
            value={locale}
            onChange={(value) => {
              if (value === 'en' || value === 'fr') {
                setLocale(value as Locale)
              }
            }}
            data={[
              { value: 'en', label: t('lang.en') },
              { value: 'fr', label: t('lang.fr') },
            ]}
          />

          <Divider />

          <Group justify="space-between">
            <Text size="xs">
              {t('params.nodes')}: {graph.nodes.length}
            </Text>
            <Text size="xs">
              {t('params.edges')}: {graph.edges.length}
            </Text>
          </Group>
        </Stack>
      </Paper>
    </Affix>
  )
}

