import type {
  CadastroSecretarioInput,
  Secretario,
} from "@clinica/shared/secretario";
import { api } from "./api.ts";

export async function cadastrarSecretario(
  dados: CadastroSecretarioInput,
): Promise<Secretario> {
  const resposta = await api.post<Secretario>("/secretarios", dados);
  return resposta.data;
}
