import { useState } from 'react'
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

  const [isOpen, setIsOpen] = useState(false)

  return (
    <Affix position={{ top: 20, right: 20 }} zIndex={100}>
      <div className="relative flex flex-col items-end">
        {/* Gear Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-center w-10 h-10 rounded-full border shadow-lg transition-all duration-300 ${isOpen ? 'rotate-90 bg-blue-500/10 border-blue-500/30 text-blue-500' : 'bg-white/10 dark:bg-black/20 backdrop-blur-md hover:bg-white/20 dark:hover:bg-black/40'}`}
          style={{ 
            borderColor: isOpen ? 'var(--app-accent)' : 'var(--app-border)',
            backgroundColor: isOpen ? 'var(--app-surface-strong)' : 'var(--app-surface)',
            color: 'var(--app-text)'
          }}
          title={t('params.title')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* Floating Panel */}
        <div 
          className={`absolute top-12 right-0 transition-all duration-300 origin-top-right ${isOpen ? 'scale-100 opacity-100 pointer-events-auto mt-2' : 'scale-95 opacity-0 pointer-events-none'}`}
        >
          <Paper 
            shadow="xl" 
            radius="lg" 
            p="md" 
            withBorder 
            w={280}
            className="backdrop-blur-xl"
            style={{ 
              backgroundColor: 'var(--app-surface)', 
              borderColor: 'var(--app-border)',
            }}
          >
            <Stack gap="sm">
              <div className="flex items-center gap-2 mb-2">
                <Text fw={800} size="md" style={{ color: 'var(--app-text)' }} className="uppercase tracking-wider">
                  {t('params.title')}
                </Text>
              </div>

              <Switch
                size="sm"
                label={<span style={{ color: 'var(--app-text)' }} className="font-medium text-sm">{t('params.directed')}</span>}
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
                label={<span style={{ color: 'var(--app-text)' }} className="font-medium text-sm">{t('params.weighted')}</span>}
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
                label={<span style={{ color: 'var(--app-text)' }} className="font-medium text-xs opacity-80">{t('params.weightPolicy')}</span>}
                value={graph.weightPolicy}
                disabled={!graph.weighted}
                onChange={(value) => {
                  if (!value) return
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
                styles={{
                  input: { backgroundColor: 'var(--app-surface-strong)', borderColor: 'var(--app-border)', color: 'var(--app-text)' }
                }}
              />

              <Divider color="var(--app-border)" my="xs" />

              <Switch
                size="sm"
                label={<span style={{ color: 'var(--app-text)' }} className="font-medium text-sm">{t('params.devMode')}</span>}
                checked={isDevMode}
                onChange={(event) =>
                  dispatch({ type: 'SET_DEV_MODE', payload: { isDevMode: event.currentTarget.checked } })
                }
                color="indigo"
              />

              <Switch
                size="sm"
                label={<span style={{ color: 'var(--app-text)' }} className="font-medium text-sm">{t('params.darkMode')}</span>}
                checked={colorScheme === 'dark'}
                onChange={toggleColorScheme}
                color="dark"
              />

              <Select
                size="xs"
                label={<span style={{ color: 'var(--app-text)' }} className="font-medium text-xs opacity-80">{t('params.language')}</span>}
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
                styles={{
                  input: { backgroundColor: 'var(--app-surface-strong)', borderColor: 'var(--app-border)', color: 'var(--app-text)' }
                }}
              />

              <Divider color="var(--app-border)" my="xs" />

              <Group justify="space-between" className="px-2 py-1.5 rounded-md" style={{ backgroundColor: 'var(--app-surface-strong)' }}>
                <Text size="xs" fw={700} style={{ color: 'var(--app-muted)' }}>
                  {t('params.nodes')}: <span style={{ color: 'var(--app-text)' }}>{graph.nodes.length}</span>
                </Text>
                <Text size="xs" fw={700} style={{ color: 'var(--app-muted)' }}>
                  {t('params.edges')}: <span style={{ color: 'var(--app-text)' }}>{graph.edges.length}</span>
                </Text>
              </Group>
            </Stack>
          </Paper>
        </div>
      </div>
    </Affix>
  )
}

