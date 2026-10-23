import * as secretarioRepository from "../repositories/secretarioRepository.js";
import bcrypt from "bcryptjs";
import type { Secretario as SecretarioPrisma } from "@prisma/client";
import type {
  CadastroSecretarioInput,
  SecretarioInput,
} from "@clinica/shared/secretario";

// O omit global em config/prisma.ts tira a senha de todas as consultas
type Secretario = Omit<SecretarioPrisma, "senha">;

const SALT_ROUNDS = 10;

export async function listarSecretarios(): Promise<Secretario[]> {
  return await secretarioRepository.findAll();
}

export async function encontrarUmSecretario(
  id: number,
): Promise<Secretario | null> {
  return await secretarioRepository.findById(id);
}

export async function criarSecretario(
  dados: CadastroSecretarioInput,
): Promise<Secretario> {
  if (!dados.nome || !dados.cpf || !dados.telefone) {
    throw new Error("Campos obrigatórios ausentes: nome, cpf e telefone.");
  }

  const existente = await secretarioRepository.findByCpf(dados.cpf);
  if (existente) {
    throw new Error("Já existe um secretário cadastrado com este CPF.");
  }

  // Nunca guardamos a senha em texto puro: o banco recebe só o hash
  const senhaHash = await bcrypt.hash(dados.senha, SALT_ROUNDS);
  return await secretarioRepository.create({ ...dados, senha: senhaHash });
}

export async function atualizarSecretario(
  id: number,
  dados: SecretarioInput,
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
