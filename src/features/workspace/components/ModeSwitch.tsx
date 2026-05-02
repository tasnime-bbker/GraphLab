import { SegmentedControl } from '@mantine/core'
import { useGraphDispatch, useGraphState } from '../../graph/state/useGraphStore'
import { useI18n } from '../../../shared/context/I18nContext'

export function ModeSwitch() {
  const dispatch = useGraphDispatch()
  const { mode } = useGraphState()
  const { t } = useI18n()

  return (
    <SegmentedControl
      aria-label={t('mode.label')}
      value={mode}
      onChange={(value) =>
        dispatch({ type: 'SET_MODE', payload: { mode: value as typeof mode } })
      }
      data={[
        { value: 'visual', label: t('mode.visual') },
        { value: 'matrix', label: t('mode.matrix') },
      ]}
    />
  )
}
