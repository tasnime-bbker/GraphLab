import {
  ActionIcon,
  Button,
  HoverCard,
  Modal,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { useState } from 'react'
import { useI18n } from '../../../shared/context/I18nContext'

export function CanvasHelp() {
  const { t } = useI18n()
  const isMobile = useMediaQuery('(max-width: 48em)')
  const [opened, setOpened] = useState(false)

  const content = (
    <Stack gap={6} maw={300}>
      <Text fw={600} size="sm">
        {t('canvas.title')}
      </Text>
      <Text size="xs">- {t('canvas.leftClick')}</Text>
      <Text size="xs">- {t('canvas.delete')}</Text>
      <Text size="xs">- {t('canvas.shortcuts')}</Text>
      <Button
        size="compact-xs"
        variant="subtle"
        component="a"
        href="/user-guide.html"
        target="_blank"
      >
        {t('help.fullGuide')}
      </Button>
    </Stack>
  )

  if (isMobile) {
    return (
      <>
        <Tooltip label={t('help.hint')}>
          <ActionIcon
            variant="filled"
            color="indigo"
            radius="xl"
            size="lg"
            onClick={() => setOpened(true)}
            aria-label={t('canvas.title')}
          >
            ?
          </ActionIcon>
        </Tooltip>
        <Modal opened={opened} onClose={() => setOpened(false)} title={t('canvas.title')}>
          {content}
        </Modal>
      </>
    )
  }

  return (
    <HoverCard openDelay={120} closeDelay={120} width={320} shadow="md" withArrow>
      <HoverCard.Target>
        <Tooltip label={t('help.hint')}>
          <ActionIcon variant="filled" color="indigo" radius="xl" size="lg" aria-label={t('canvas.title')}>
            ?
          </ActionIcon>
        </Tooltip>
      </HoverCard.Target>
      <HoverCard.Dropdown>{content}</HoverCard.Dropdown>
    </HoverCard>
  )
}


