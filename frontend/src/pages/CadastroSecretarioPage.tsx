import { useState } from "react";
import {
  Alert,
  Anchor,
  Box,
  Button,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import axios from "axios";
import { cadastroSecretarioSchema } from "@clinica/shared/secretario";
import { cadastrarSecretario } from "../services/api.ts";

type Props = {
  onVoltarParaLogin: () => void;
};

export function CadastroSecretarioPage({ onVoltarParaLogin }: Props) {
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [erro, setErro] = useState("");
  const [erroNome, setErroNome] = useState("");
  const [erroCpf, setErroCpf] = useState("");
  const [erroTelefone, setErroTelefone] = useState("");
  const [erroEmail, setErroEmail] = useState("");
  const [erroSenha, setErroSenha] = useState("");
  const [erroConfirmarSenha, setErroConfirmarSenha] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function cadastrar() {
    setErro("");
    setErroNome("");
    setErroCpf("");
    setErroTelefone("");
    setErroEmail("");
    setErroSenha("");
    setErroConfirmarSenha("");
    setSucesso("");

    if (senha !== confirmarSenha) {
      setErroConfirmarSenha("As senhas não conferem");
      return;
    }

    // Confere o formato aqui mesmo, com as mesmas regras da API
    const validacao = cadastroSecretarioSchema.safeParse({
      nome,
      cpf,
      telefone,
      email,
      senha,
    });
    if (!validacao.success) {
      for (const problema of validacao.error.issues) {
        if (problema.path[0] === "nome") setErroNome(problema.message);
        if (problema.path[0] === "cpf") setErroCpf(problema.message);
        if (problema.path[0] === "telefone") setErroTelefone(problema.message);
        if (problema.path[0] === "email") setErroEmail(problema.message);
        if (problema.path[0] === "senha") setErroSenha(problema.message);
      }
      return; // não chama a API
    }

    setCarregando(true);
    try {
      const secretario = await cadastrarSecretario(
        nome,
        cpf,
        telefone,
        email,
        senha,
      );
      setSucesso(`${secretario.nome} foi cadastrado(a) com sucesso!`);
      setNome("");
      setCpf("");
      setTelefone("");
      setEmail("");
      setSenha("");
      setConfirmarSenha("");
    } catch (e) {
      if (axios.isAxiosError(e) && e.response) {
        const dados = e.response.data;
        setErro(dados.mensagem);
        if (dados.detalhes) {
          for (const detalhe of dados.detalhes) {
            if (detalhe.campo === "nome") setErroNome(detalhe.mensagem);
            if (detalhe.campo === "cpf") setErroCpf(detalhe.mensagem);
            if (detalhe.campo === "telefone") setErroTelefone(detalhe.mensagem);
            if (detalhe.campo === "email") setErroEmail(detalhe.mensagem);
            if (detalhe.campo === "senha") setErroSenha(detalhe.mensagem);
          }
        }
      } else {
        setErro("Não foi possível conectar à API. Ela está rodando?");
      }
    }
    setCarregando(false);
  }

  return (
    <Box w="100%" maw={420}>
      <Title order={1} fz={32}>
        Cadastro de secretário
      </Title>
      <Text c="dimmed" mb="xl">
        Para quem trabalha na recepção
      </Text>
      <form
        onSubmit={(evento) => {
          evento.preventDefault();
          cadastrar();
        }}
      >
        <Stack>
          {sucesso && <Alert color="green">{sucesso}</Alert>}
          {erro && <Alert color="red">{erro}</Alert>}
          <TextInput
            label="Nome"
            value={nome}
            onChange={(evento) => setNome(evento.target.value)}
            error={erroNome}
          />
          <TextInput
            label="CPF"
            value={cpf}
            onChange={(evento) => setCpf(evento.target.value)}
            error={erroCpf}
          />
          <TextInput
            label="Telefone"
            value={telefone}
            onChange={(evento) => setTelefone(evento.target.value)}
            error={erroTelefone}
          />
          <TextInput
            label="E-mail"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            error={erroEmail}
          />
          <PasswordInput
            label="Senha"
            value={senha}
            onChange={(evento) => setSenha(evento.target.value)}
            error={erroSenha}
          />
          <PasswordInput
            label="Confirmar senha"
            value={confirmarSenha}
            onChange={(evento) => setConfirmarSenha(evento.target.value)}
            error={erroConfirmarSenha}
          />
          <Button type="submit" loading={carregando}>
            Cadastrar
          </Button>
          <Text size="sm" ta="center">
            Já tem conta?
            <Anchor
              component="button"
              type="button"
              onClick={onVoltarParaLogin}
            >
              Entrar
            </Anchor>
          </Text>
        </Stack>
      </form>
    </Box>
  );
}
