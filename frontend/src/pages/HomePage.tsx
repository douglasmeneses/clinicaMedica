import { Button, Paper, Stack, Text, Title } from "@mantine/core";
import type { Secretario } from "@clinica/shared/secretario";

type HomePageProps = {
  secretario: Secretario;
  onSair: () => void;
};

export function HomePage({ secretario, onSair }: HomePageProps) {
  return (
    <Paper withBorder shadow="sm" p="lg" radius="md">
      <Stack>
        <Title order={2}>Olá, {secretario.nome}!</Title>
        <Text c="dimmed">Você está logado(a) com o CPF {secretario.cpf}.</Text>
        <Button variant="light" color="red" onClick={onSair}>
          Sair
        </Button>
      </Stack>
    </Paper>
  );
}
