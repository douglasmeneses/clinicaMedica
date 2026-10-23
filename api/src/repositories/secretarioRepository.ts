import { prisma } from "../config/prisma.js";
import type { SecretarioDTO } from "../types/secretario.js";

export async function findAll() {
  return await prisma.secretario.findMany();
  //SELECT * FROM secretarios;
}

export async function findById(id: number) {
  return await prisma.secretario.findUnique({ where: { id } });
  //SELECT * FROM secretarios WHERE id = ?;
}

export async function findByCpf(cpf: string) {
  return await prisma.secretario.findUnique({ where: { cpf } });
  //SELECT * FROM secretarios WHERE cpf = ?;
}

export async function create(data: SecretarioDTO) {
  return await prisma.secretario.create({ data });
  //INSERT INTO secretarios (nome, cpf, telefone, email) VALUES (?, ?, ?, ?);
}

export async function update(id: number, data: SecretarioDTO) {
  return await prisma.secretario.update({ where: { id }, data });
  //UPDATE secretarios SET nome = ?, cpf = ?, telefone = ?, email = ? WHERE id = ?;
}

export async function remove(id: number) {
  return await prisma.secretario.delete({ where: { id } });
  //DELETE FROM secretarios WHERE id = ?;
}
