import { useState } from "react";
import {
  Alert,
  Anchor,
  Button,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";
import axios from "axios";
import { loginSchema, type LoginInput } from "@clinica/shared/auth";
import type { Secretario } from "@clinica/shared/secretario";
import type { ErroApi } from "../services/api.ts";
import { login } from "../services/authService.ts";

type LoginPageProps = {
  onLogin: (secretario: Secretario) => void;
  onIrParaCadastro: () => void;
};

export function LoginPage({ onLogin, onIrParaCadastro }: LoginPageProps) {
  const [erro, setErro] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    mode: "uncontrolled",
    initialValues: { cpf: "", senha: "" },
    validate: schemaResolver(loginSchema, { sync: true }),
  });

  async function entrar(valores: LoginInput) {
    setErro(null);
    try {
      const secretario = await login(valores);
      onLogin(secretario);
    } catch (e) {
      if (axios.isAxiosError<ErroApi>(e) && e.response) {
        setErro(e.response.data.mensagem);
      } else {
        setErro("Não foi possível conectar à API. Ela está rodando?");
      }
    }
  }

  return (
    <Paper withBorder shadow="md" p="xl" radius="md" w="100%" maw={400}>
      <Text c="blue" fw={700} size="sm">
        Clínica Médica
      </Text>
      <Title order={2}>Entrar</Title>
      <Text c="dimmed" size="sm" mb="lg">
        Acesse com seu CPF e senha
      </Text>

      <form onSubmit={form.onSubmit(entrar)}>
        <Stack>
          {erro && <Alert color="red">{erro}</Alert>}

          <TextInput
            label="CPF"
            placeholder="Somente números"
            key={form.key("cpf")}
            {...form.getInputProps("cpf")}
          />
          <PasswordInput
            label="Senha"
            placeholder="Sua senha"
            key={form.key("senha")}
            {...form.getInputProps("senha")}
          />

          <Button type="submit" loading={form.submitting}>
            Entrar
          </Button>

          <Text size="sm" ta="center">
            Ainda não tem conta?{" "}
            <Anchor component="button" type="button" onClick={onIrParaCadastro}>
              Cadastre-se
            </Anchor>
          </Text>
        </Stack>
      </form>
    </Paper>
  );
}
