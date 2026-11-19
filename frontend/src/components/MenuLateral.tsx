import type { ReactNode } from 'react'
import { AppShell, Avatar, Box, Burger, Button, Group, NavLink, Stack, Text, ThemeIcon } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconCalendarEvent, IconLogout, IconStethoscope } from '@tabler/icons-react'

type Props = {
  nome: string
  onSair: () => void
  children: ReactNode
}

// Moldura das telas de dentro: menu escuro à esquerda (no celular, atrás do ☰) e o conteúdo no meio
export function MenuLateral({ nome, onSair, children }: Props) {
  const [menuAberto, { toggle: alternarMenu }] = useDisclosure()

  return (
    <AppShell
      navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: !menuAberto } }}
      header={{ height: { base: 56, sm: 0 } }}
      padding={{ base: 'md', sm: 32 }}
    >
      <AppShell.Header hiddenFrom="sm" bg="clinica.9" withBorder={false}>
        <Group h="100%" px="md" gap="sm">
          <Burger opened={menuAberto} onClick={alternarMenu} color="white" size="sm" aria-label="Abrir menu" />
          <Text c="white" fw={700}>Clínica Médica</Text>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar bg="clinica.9" c="white" p="md" withBorder={false}>
        <Group gap="sm" mb={32} visibleFrom="sm">
          <ThemeIcon size={36} radius="md" color="clinica.5">
            <IconStethoscope size={20} />
          </ThemeIcon>
          <Text fw={700} fz="lg">Clínica Médica</Text>
        </Group>

        <Stack gap={4} style={{ flex: 1 }}>
          <NavLink
            label="Consultas"
            leftSection={<IconCalendarEvent size={20} stroke={1.75} />}
            active
            variant="filled"
            color="clinica.7"
            c="white"
            style={{ borderRadius: 8 }}
          />
        </Stack>

        <Box pt="md" style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
          <Group gap="sm" mb="sm" wrap="nowrap">
            <Avatar color="clinica.3" variant="filled" radius="xl">{nome[0]}</Avatar>
            <Box style={{ minWidth: 0 }}>
              <Text fw={700} size="sm" truncate>{nome}</Text>
              <Text size="xs" c="clinica.1">Recepção</Text>
            </Box>
          </Group>
          <Button fullWidth variant="subtle" color="gray.0" justify="flex-start" leftSection={<IconLogout size={18} />} onClick={onSair}>
            Sair
          </Button>
        </Box>
      </AppShell.Navbar>

      <AppShell.Main bg="#f2f7f6">
        <Box maw={1080}>{children}</Box>
      </AppShell.Main>
    </AppShell>
  )
}
