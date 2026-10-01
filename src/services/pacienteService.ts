import * as pacienteRepository from "../repositories/pacienteRepository.js";
import type { Paciente } from "@prisma/client";
import type { PacienteDTO } from "../types/paciente.js";

export async function listarPacientes(): Promise<Paciente[]> {
  return await pacienteRepository.findAll();
}

export async function encontrarUmPaciente(id: number): Promise<Paciente | null> {
  return await pacienteRepository.findById(id);
}

export async function criarPaciente(dados: PacienteDTO): Promise<Paciente> {
  return await pacienteRepository.create(dados);
}

export async function atualizarPaciente(
  id: number,
  dados: PacienteDTO,
): Promise<Paciente> {
  return await pacienteRepository.update(id, dados);
}

export async function deletarPaciente(id: number): Promise<void> {
  await pacienteRepository.remove(id);
}
