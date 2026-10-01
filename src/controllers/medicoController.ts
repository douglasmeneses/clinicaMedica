import type { Request, Response } from "express";
import * as service from "../services/medicoService.js";

export async function listar(req: Request, res: Response) {
  const medicos: Medico[] = service.listarMedicos();
  return res.json(medicos);
}

export async function buscarPorId(req: Request, res: Response) {
  const id: number = Number(req.params.id);
  const medico: Medico = service.encontrarUmMedico(id);
  res.json(medico);
}

export async function cadastrar(req: Request, res: Response) {
  const dados: MedicoDTO = req.body;
  const medico: Medico = service.criarMedico(dados);
  res.status(201).json(medico);
}

export async function atualizar(req: Request, res: Response) {
  const id: number = Number(req.params.id);
  const dados: MedicoDTO = req.body;
  const medico: Medico = service.atualizarMedico(id, dados);
  res.json(medico);
}

export async function deletar(req: Request, res: Response) {
  const id: number = Number(req.params.id);
  service.deletarMedico(id);
  res.status(204).send();
}
