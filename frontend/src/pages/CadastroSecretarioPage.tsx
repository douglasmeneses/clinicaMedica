import { useState } from "react";
import {
  Alert,
  Button,
  Paper,
  PasswordInput,
  Stack,
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

export function CadastroSecretarioPage() {
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
    <Paper withBorder shadow="sm" p="lg" radius="md">
      <Title order={2} mb="md">
        Cadastro de secretário
      </Title>

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
          <TextInput
            label="CPF"
            description="Somente os 11 números"
            withAsterisk
            key={form.key("cpf")}
            {...form.getInputProps("cpf")}
          />
          <TextInput
            label="Telefone"
            withAsterisk
            key={form.key("telefone")}
            {...form.getInputProps("telefone")}
          />
          <TextInput
            label="E-mail"
            key={form.key("email")}
            {...form.getInputProps("email")}
          />
          <PasswordInput
            label="Senha"
            description="Pelo menos 8 caracteres"
            withAsterisk
            key={form.key("senha")}
            {...form.getInputProps("senha")}
          />
          <PasswordInput
            label="Confirmar senha"
            withAsterisk
            key={form.key("confirmarSenha")}
            {...form.getInputProps("confirmarSenha")}
          />

          <Button type="submit" loading={form.submitting}>
            Cadastrar
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}
