import { useState } from "react";
import {
  Alert,
  Anchor,
  Button,
  Paper,
  PasswordInput,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";
import axios from "axios";
import { z } from "zod";
import { cadastroSecretarioSchema } from "@clinica/shared/secretario";
import type { ErroApi } from "../services/api.ts";
import { cadastrarSecretario } from "../services/secretarioService.ts";

// Mesmo schema da API + a confirmação de senha, que só existe na tela
const formularioSchema = cadastroSecretarioSchema
  .extend({ confirmarSenha: z.string() })
  .refine((dados) => dados.senha === dados.confirmarSenha, {
    message: "As senhas não conferem",
    path: ["confirmarSenha"],
  });

type FormularioValores = {
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  senha: string;
  confirmarSenha: string;
};

type CadastroSecretarioPageProps = {
  onIrParaLogin: () => void;
};

export function CadastroSecretarioPage({
  onIrParaLogin,
}: CadastroSecretarioPageProps) {
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const form = useForm<FormularioValores>({
    mode: "uncontrolled",
    initialValues: {
      nome: "",
      cpf: "",
      telefone: "",
      email: "",
      senha: "",
      confirmarSenha: "",
    },
    validate: schemaResolver(formularioSchema, { sync: true }),
  });

  async function cadastrar(valores: FormularioValores) {
    setSucesso(null);
    setErro(null);

    // confirmarSenha não vai para a API
    const { confirmarSenha: _, ...dados } = valores;

    try {
      const secretario = await cadastrarSecretario(dados);
      setSucesso(`${secretario.nome} foi cadastrado(a) com sucesso!`);
      form.reset();
    } catch (e) {
      if (axios.isAxiosError<ErroApi>(e) && e.response) {
        const { mensagem, detalhes } = e.response.data;
        if (detalhes) {
          form.setErrors(
            Object.fromEntries(detalhes.map((d) => [d.campo, d.mensagem])),
          );
        }
        setErro(mensagem);
      } else {
        setErro("Não foi possível conectar à API. Ela está rodando?");
      }
    }
  }

  return (
    <Paper withBorder shadow="md" p="xl" radius="md" w="100%" maw={560}>
      <Text c="blue" fw={700} size="sm">
        Clínica Médica
      </Text>
      <Title order={2}>Cadastro de secretário</Title>
      <Text c="dimmed" size="sm" mb="lg">
        Preencha seus dados para criar o acesso
      </Text>

      <form onSubmit={form.onSubmit(cadastrar)}>
        <Stack>
          {sucesso && <Alert color="green">{sucesso}</Alert>}
          {erro && <Alert color="red">{erro}</Alert>}

          <TextInput
            label="Nome"
            withAsterisk
            key={form.key("nome")}
            {...form.getInputProps("nome")}
          />
          {/* 1 coluna no celular, 2 a partir de telas "sm" (48em) */}
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput
              label="CPF"
              placeholder="Somente números"
              withAsterisk
              key={form.key("cpf")}
              {...form.getInputProps("cpf")}
            />
            <TextInput
              label="Telefone"
              placeholder="DDD + número"
              withAsterisk
              key={form.key("telefone")}
              {...form.getInputProps("telefone")}
            />
          </SimpleGrid>
          <TextInput
            label="E-mail"
            placeholder="nome@clinica.com (opcional)"
            key={form.key("email")}
            {...form.getInputProps("email")}
          />
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <PasswordInput
              label="Senha"
              placeholder="Mínimo 8 caracteres"
              withAsterisk
              key={form.key("senha")}
              {...form.getInputProps("senha")}
            />
            <PasswordInput
              label="Confirmar senha"
              placeholder="Repita a senha"
              withAsterisk
              key={form.key("confirmarSenha")}
              {...form.getInputProps("confirmarSenha")}
            />
          </SimpleGrid>

          <Button type="submit" loading={form.submitting}>
            Cadastrar
          </Button>

          <Text size="sm" ta="center">
            Já tem conta?{" "}
            <Anchor component="button" type="button" onClick={onIrParaLogin}>
              Entrar
            </Anchor>
          </Text>
        </Stack>
      </form>
    </Paper>
  );
}
