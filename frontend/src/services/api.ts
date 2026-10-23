import type { Paciente } from "../types/paciente.ts";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function listarPacientes(): Promise<Paciente[]> {
  const resposta = await fetch(`${API_URL}/pacientes`);
  if (!resposta.ok) {
    throw new Error(`Erro ao buscar pacientes (HTTP ${resposta.status})`);
  }
  return resposta.json();
}
