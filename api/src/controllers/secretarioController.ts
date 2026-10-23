import type { Request, Response } from "express";
import * as service from "../services/secretarioService.js";
import type { SecretarioDTO } from "../types/secretario.js";

export async function listar(req: Request, res: Response) {
  const secretarios = await service.listarSecretarios();
  return res.json(secretarios);
}

export async function buscarPorId(req: Request, res: Response) {
  const id: number = Number(req.params.id);
  const secretario = await service.encontrarUmSecretario(id);
  if (!secretario) {
    return res.status(404).json({ mensagem: "Secretário não encontrado" });
  }
  return res.json(secretario);
}

export async function cadastrar(req: Request, res: Response) {
  const dados: SecretarioDTO = req.body;
  const secretario = await service.criarSecretario(dados);
  return res.status(201).json(secretario);
}

export async function atualizar(req: Request, res: Response) {
  const id: number = Number(req.params.id);
  const dados: SecretarioDTO = req.body;
  const secretario = await service.atualizarSecretario(id, dados);
  return res.json(secretario);
}

export async function deletar(req: Request, res: Response) {
  const id: number = Number(req.params.id);
  await service.deletarSecretario(id);
  return res.status(204).send();
}
