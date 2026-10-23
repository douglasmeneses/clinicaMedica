import * as medicoRepository from "../repositories/medicoRepository.js";
import type { Medico } from "@prisma/client";
import type { MedicoDTO } from "../types/medico.js";

export async function listarMedicos(): Promise<Medico[]> {
  return await medicoRepository.findAll();
}

export async function encontrarUmMedico(id: number): Promise<Medico | null> {
  return await medicoRepository.findById(id);
}

export async function criarMedico(dados: MedicoDTO): Promise<Medico> {
  return await medicoRepository.create(dados);
}

export async function atualizarMedico(
  id: number,
  dados: MedicoDTO,
): Promise<Medico> {
  return await medicoRepository.update(id, dados);
}

export async function deletarMedico(id: number): Promise<void> {
  await medicoRepository.remove(id);
}
