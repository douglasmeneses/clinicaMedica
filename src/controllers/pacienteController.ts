import type { Request, Response } from "express";
import * as service from "../services/pacienteService.js";
import type { PacienteDTO } from "../types/paciente.js";

export async function listar(req: Request, res: Response) {
  const pacientes = await service.listarPacientes();
  return res.json(pacientes);
}

export async function buscarPorId(req: Request, res: Response) {
  const id: number = Number(req.params.id);
  const paciente = await service.encontrarUmPaciente(id);
  if (!paciente) {
    return res.status(404).json({ mensagem: "Paciente não encontrado" });
  }
  return res.json(paciente);
}

export async function cadastrar(req: Request, res: Response) {
  const dados: PacienteDTO = req.body;
  const paciente = await service.criarPaciente(dados);
  return res.status(201).json(paciente);
}

export async function atualizar(req: Request, res: Response) {
  const id: number = Number(req.params.id);
  const dados: PacienteDTO = req.body;
  const paciente = await service.atualizarPaciente(id, dados);
  return res.json(paciente);
}

export async function deletar(req: Request, res: Response) {
  const id: number = Number(req.params.id);
  await service.deletarPaciente(id);
  return res.status(204).send();
}
