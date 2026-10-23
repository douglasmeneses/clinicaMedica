import * as consultaRepository from "../repositories/consultaRepository.js";
import * as medicoService from "./medicoService.js";
import * as pacienteService from "./pacienteService.js";
import type { Consulta } from "@prisma/client";
import type { ConsultaDTO } from "../types/consulta.js";

// Regra de Negócio: Limite máximo de pacientes atendidos por turno
const LIMITE_CONSULTAS_POR_TURNO = 5;

export async function listarConsultas(): Promise<Consulta[]> {
  return await consultaRepository.findAll();
}

export async function encontrarUmaConsulta(
  id: number,
): Promise<Consulta | null> {
  return await consultaRepository.findById(id);
}

export async function criarConsulta(dados: ConsultaDTO): Promise<Consulta> {
  if (!dados.data || !dados.turno || !dados.medicoId || !dados.pacienteId) {
    throw new Error(
      "Campos obrigatórios ausentes: data, turno, medicoId e pacienteId são obrigatórios.",
    );
  }

  // 1. Validar se o turno é "M" ou "T"
  const turnoNormalizado = dados.turno.toUpperCase();
  if (turnoNormalizado !== "M" && turnoNormalizado !== "T") {
    throw new Error("Turno inválido. O turno deve ser 'M' ou 'T'.");
  }

  // 2. Validar existência do Médico via medicoService
  const medico = await medicoService.encontrarUmMedico(Number(dados.medicoId));
  if (!medico) {
    throw new Error(`Médico com ID ${dados.medicoId} não encontrado.`);
  }

  // 3. Validar existência do Paciente via pacienteService
  const paciente = await pacienteService.encontrarUmPaciente(
    Number(dados.pacienteId),
  );
  if (!paciente) {
    throw new Error(`Paciente com ID ${dados.pacienteId} não encontrado.`);
  }

  // 4. Regra de Negócio: O mesmo paciente não pode marcar duas consultas no mesmo turno e data
  const consultaExistentePaciente =
    await consultaRepository.findByPacienteDataTurno(
      Number(dados.pacienteId),
      dados.data,
      turnoNormalizado,
    );

  if (consultaExistentePaciente) {
    throw new Error(
      `O paciente ${paciente.nome} já possui uma consulta marcada para o turno ${turnoNormalizado} no dia ${dados.data}.`,
    );
  }

  // 5. Regra de Negócio: Limite de 5 pacientes por turno para o médico
  const totalConsultasNoTurno =
    await consultaRepository.countByMedicoDataTurno(
      Number(dados.medicoId),
      dados.data,
      turnoNormalizado,
    );

  if (totalConsultasNoTurno >= LIMITE_CONSULTAS_POR_TURNO) {
    throw new Error(
      `O médico Dr(a). ${medico.nome} já atingiu o limite de ${LIMITE_CONSULTAS_POR_TURNO} pacientes para o turno ${turnoNormalizado} no dia ${dados.data}.`,
    );
  }

  return await consultaRepository.create({
    data: dados.data,
    turno: turnoNormalizado,
    medicoId: Number(dados.medicoId),
    pacienteId: Number(dados.pacienteId),
  });
}

export async function atualizarConsulta(
  id: number,
  dados: ConsultaDTO,
): Promise<Consulta> {
  const existente = await consultaRepository.findById(id);
  if (!existente) {
    throw new Error("Consulta não encontrada.");
  }

  // 1. Validar se o turno é "M" ou "T"
  const turnoNormalizado = dados.turno.toUpperCase();
  if (turnoNormalizado !== "M" && turnoNormalizado !== "T") {
    throw new Error("Turno inválido. O turno deve ser 'M' ou 'T'.");
  }

  const medicoId = Number(dados.medicoId);
  const pacienteId = Number(dados.pacienteId);

  // 2. Validar existência do Médico via medicoService
  const medico = await medicoService.encontrarUmMedico(medicoId);
  if (!medico) {
    throw new Error(`Médico com ID ${medicoId} não encontrado.`);
  }

  // 3. Validar existência do Paciente via pacienteService
  const paciente = await pacienteService.encontrarUmPaciente(pacienteId);
  if (!paciente) {
    throw new Error(`Paciente com ID ${pacienteId} não encontrado.`);
  }

  // 4. Regra de Negócio: Evitar duplicidade do mesmo paciente no mesmo turno
  const consultaExistentePaciente =
    await consultaRepository.findByPacienteDataTurno(
      pacienteId,
      dados.data,
      turnoNormalizado,
      id,
    );

  if (consultaExistentePaciente) {
    throw new Error(
      `O paciente ${paciente.nome} já possui outra consulta agendada para o turno ${turnoNormalizado} no dia ${dados.data}.`,
    );
  }

  // 5. Regra de Negócio: Limite de 5 pacientes por turno para o médico
  const totalConsultasNoTurno =
    await consultaRepository.countByMedicoDataTurno(
      medicoId,
      dados.data,
      turnoNormalizado,
      id,
    );

  if (totalConsultasNoTurno >= LIMITE_CONSULTAS_POR_TURNO) {
    throw new Error(
      `O médico Dr(a). ${medico.nome} já atingiu o limite de ${LIMITE_CONSULTAS_POR_TURNO} pacientes para o turno ${turnoNormalizado} no dia ${dados.data}.`,
    );
  }

  return await consultaRepository.update(id, {
    data: dados.data,
    turno: turnoNormalizado,
    medicoId,
    pacienteId,
  });
}

export async function deletarConsulta(id: number): Promise<void> {
  const existente = await consultaRepository.findById(id);
  if (!existente) {
    throw new Error("Consulta não encontrada.");
  }

  await consultaRepository.remove(id);
}
