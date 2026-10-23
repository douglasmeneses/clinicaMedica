import type { Request, Response } from "express";
import * as service from "../services/medicoService.js";
import type { MedicoDTO } from "../types/medico.js";

export async function listar(req: Request, res: Response) {
  const medicos = await service.listarMedicos();
  return res.json(medicos);
}

export async function buscarPorId(req: Request, res: Response) {
  const id: number = Number(req.params.id);
  const medico = await service.encontrarUmMedico(id);
  if (!medico) {
    return res.status(404).json({ mensagem: "Médico não encontrado" });
  }
  return res.json(medico);
}

export async function cadastrar(req: Request, res: Response) {
  const dados: MedicoDTO = req.body;
  const medico = await service.criarMedico(dados);
  return res.status(201).json(medico);
}

export async function atualizar(req: Request, res: Response) {
  const id: number = Number(req.params.id);
  const dados: MedicoDTO = req.body;
  const medico = await service.atualizarMedico(id, dados);
  return res.json(medico);
}

export async function deletar(req: Request, res: Response) {
  const id: number = Number(req.params.id);
  await service.deletarMedico(id);
  return res.status(204).send();
}
