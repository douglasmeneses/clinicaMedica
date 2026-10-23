import { z } from "zod";

// .meta() é do próprio Zod: o swagger da API lê o example daqui,
// sem que este pacote dependa de nada do backend.
export const secretarioSchema = z.object({
  nome: z
    .string({ error: "O nome é obrigatório" })
    .min(3, "O nome deve ter pelo menos 3 caracteres")
    .max(100, "O nome deve ter no máximo 100 caracteres")
    .meta({ example: "Maria Oliveira" }),

  cpf: z
    .string({ error: "O CPF é obrigatório" })
    .regex(/^\d{11}$/, "O CPF deve conter exatamente 11 números (apenas dígitos)")
    .meta({ example: "12345678901" }),

  telefone: z
    .string({ error: "O telefone é obrigatório" })
    .min(10, "O telefone deve ter pelo menos 10 dígitos")
    .max(15, "O telefone deve ter no máximo 15 dígitos")
    .meta({ example: "79999998888" }),

  // E-mail é opcional: campo vazio do formulário ("") ou ausente vira null
  email: z
    .preprocess(
      (valor) => (valor === "" || valor === undefined ? null : valor),
      z.email("E-mail com formato inválido").nullable(),
    )
    .meta({ example: "maria@clinica.com" }),
});

// Cadastro = dados do secretário + senha. A senha fica fora do secretarioSchema
// para nunca aparecer na resposta da API nem no PUT de atualização.
export const cadastroSecretarioSchema = secretarioSchema.extend({
  senha: z
    .string({ error: "A senha é obrigatória" })
    .min(8, "A senha deve ter pelo menos 8 caracteres")
    .max(72, "A senha deve ter no máximo 72 caracteres")
    .meta({ example: "senhaForte123" }),
});

export type SecretarioInput = z.infer<typeof secretarioSchema>;
export type CadastroSecretarioInput = z.infer<typeof cadastroSecretarioSchema>;

// Formato que a API devolve (sem senha)
export type Secretario = SecretarioInput & { id: number };
