import type { LoginInput } from "@clinica/shared/auth";
import type { Secretario } from "@clinica/shared/secretario";
import { api } from "./api.ts";

export async function login(dados: LoginInput): Promise<Secretario> {
  const resposta = await api.post<Secretario>("/auth/login", dados);
  return resposta.data;
}
