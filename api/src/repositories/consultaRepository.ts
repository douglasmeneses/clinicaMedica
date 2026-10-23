import { prisma } from "../config/prisma.js";

export async function findAll() {
  return await prisma.consulta.findMany({
    include: {
      medico: true,
      paciente: true,
    },
    orderBy: {
      id: "asc",
    },
  });
  //SELECT c.*, m.*, p.* FROM consultas c
  //JOIN medicos m ON c.medico_id = m.id
  //JOIN pacientes p ON c.paciente_id = p.id;
}

export async function findById(id: number) {
  return await prisma.consulta.findUnique({
    where: { id },
    include: {
      medico: true,
      paciente: true,
    },
  });
  //SELECT c.*, m.*, p.* FROM consultas c
  //JOIN medicos m ON c.medico_id = m.id
  //JOIN pacientes p ON c.paciente_id = p.id
  //WHERE c.id = ?;
}

export async function countByMedicoDataTurno(
  medicoId: number,
  data: string,
  turno: string,
  ignorarConsultaId?: number,
) {
  return await prisma.consulta.count({
    where: {
      medicoId,
      data,
      turno,
      ...(ignorarConsultaId ? { NOT: { id: ignorarConsultaId } } : {}),
    },
  });
  //SELECT COUNT(*) FROM consultas
  //WHERE medico_id = ? AND data = ? AND turno = ?;
}

export async function findByPacienteDataTurno(
  pacienteId: number,
  data: string,
  turno: string,
  ignorarConsultaId?: number,
) {
  return await prisma.consulta.findFirst({
    where: {
      pacienteId,
      data,
      turno,
      ...(ignorarConsultaId ? { NOT: { id: ignorarConsultaId } } : {}),
    },
  });
  //SELECT * FROM consultas
  //WHERE paciente_id = ? AND data = ? AND turno = ?;
}

export async function create(data: {
  data: string;
  turno: string;
  medicoId: number;
  pacienteId: number;
}) {
  return await prisma.consulta.create({
    data,
    include: {
      medico: true,
      paciente: true,
    },
  });
  //INSERT INTO consultas (data, turno, medico_id, paciente_id)
  //VALUES (?, ?, ?, ?);
}

export async function update(
  id: number,
  data: {
    data: string;
    turno: string;
    medicoId: number;
    pacienteId: number;
  },
) {
  return await prisma.consulta.update({
    where: { id },
    data,
    include: {
      medico: true,
      paciente: true,
    },
  });
  //UPDATE consultas SET data = ?, turno = ?, medico_id = ?, paciente_id = ?
  //WHERE id = ?;
}

export async function remove(id: number) {
  return await prisma.consulta.delete({
    where: { id },
  });
  //DELETE FROM consultas WHERE id = ?;
}
