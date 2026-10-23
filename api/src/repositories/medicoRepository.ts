import { prisma } from "../config/prisma.js";
import type { MedicoInput } from "@clinica/shared/medico";

export async function findAll() {
  return await prisma.medico.findMany();
  //SELECT * FROM medicos;
}

export async function findById(id: number) {
  return await prisma.medico.findUnique({ where: { id } });
  //SELECT * FROM medicos WHERE id = ?;
}

export async function create(data: MedicoInput) {
  return await prisma.medico.create({ data });
  //INSERT INTO medicos (nome, crm, especialidade) VALUES (?, ?, ?);
}

export async function update(id: number, data: MedicoInput) {
  return await prisma.medico.update({ where: { id }, data });
  //UPDATE medicos SET nome = ?, crm = ?, especialidade = ? WHERE id = ?;
}

export async function remove(id: number) {
  return await prisma.medico.delete({ where: { id } });
  //DELETE FROM medicos WHERE id = ?;
}
