import { prisma } from "../config/prisma.js";
import type { PacienteDTO } from "../types/paciente.js";

export async function findAll() {
  return await prisma.paciente.findMany();
  //SELECT * FROM pacientes;
}

export async function findById(id: number) {
  return await prisma.paciente.findUnique({ where: { id } });
  //SELECT * FROM pacientes WHERE id = ?;
}

export async function create(data: PacienteDTO) {
  return await prisma.paciente.create({ data });
  //INSERT INTO pacientes (nome, cpf, telefone) VALUES (?, ?, ?);
}

export async function update(id: number, data: PacienteDTO) {
  return await prisma.paciente.update({ where: { id }, data });
  //UPDATE pacientes SET nome = ?, cpf = ?, telefone = ? WHERE id = ?;
}

export async function remove(id: number) {
  return await prisma.paciente.delete({ where: { id } });
  //DELETE FROM pacientes WHERE id = ?;
}
