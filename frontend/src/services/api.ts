import axios from "axios";
import type { Consulta, ConsultaInput } from "@clinica/shared/consulta";
import type { Medico } from "@clinica/shared/medico";
import type { Paciente } from "@clinica/shared/paciente";

// Todas as chamadas vão para a nossa API
const api = axios.create({
  baseURL: "http://localhost:3000",
});

export async function listarConsultas(): Promise<Consulta[]> {
  const resposta = await api.get("/consultas");
  return resposta.data;
}

export async function login(cpf: string, senha: string) {
  const resposta = await api.post("/auth/login", { cpf, senha });
  return resposta.data;
}

export async function cadastrarSecretario(
  nome: string,
  cpf: string,
  telefone: string,
  email: string,
  senha: string,
) {
  const resposta = await api.post("/secretarios", {
    nome,
    cpf,
    telefone,
    email,
    senha,
  });
  return resposta.data;
}

export async function listarPacientes(): Promise<Paciente[]> {
  const resposta = await api.get("/pacientes");
  return resposta.data;
}

export async function listarMedicos(): Promise<Medico[]> {
  const resposta = await api.get("/medicos");
  return resposta.data;
}

export async function cadastrarConsulta(consulta: ConsultaInput) {
  const resposta = await api.post("/consultas", consulta);
  return resposta.data;
}
