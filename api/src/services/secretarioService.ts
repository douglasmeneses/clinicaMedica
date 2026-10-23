import * as secretarioRepository from "../repositories/secretarioRepository.js";
import type { Secretario } from "@prisma/client";
import type { SecretarioDTO } from "../types/secretario.js";

export async function listarSecretarios(): Promise<Secretario[]> {
  return await secretarioRepository.findAll();
}

export async function encontrarUmSecretario(
  id: number,
): Promise<Secretario | null> {
  return await secretarioRepository.findById(id);
}

export async function criarSecretario(
  dados: SecretarioDTO,
): Promise<Secretario> {
  if (!dados.nome || !dados.cpf || !dados.telefone) {
    throw new Error("Campos obrigatórios ausentes: nome, cpf e telefone.");
  }

  const existente = await secretarioRepository.findByCpf(dados.cpf);
  if (existente) {
    throw new Error("Já existe um secretário cadastrado com este CPF.");
  }

  return await secretarioRepository.create(dados);
}

export async function atualizarSecretario(
  id: number,
  dados: SecretarioDTO,
): Promise<Secretario> {
  const existente = await secretarioRepository.findById(id);
  if (!existente) {
    throw new Error("Secretário não encontrado.");
  }

  return await secretarioRepository.update(id, dados);
}

export async function deletarSecretario(id: number): Promise<void> {
  const existente = await secretarioRepository.findById(id);
  if (!existente) {
    throw new Error("Secretário não encontrado.");
  }

  await secretarioRepository.remove(id);
}
