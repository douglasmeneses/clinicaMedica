import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const secretarioSchema = z.object({
  nome: z
    .string({ error: "O nome é obrigatório" })
    .min(3, "O nome deve ter pelo menos 3 caracteres")
    .max(100, "O nome deve ter no máximo 100 caracteres")
    .openapi({ example: "Maria Oliveira" }),

  cpf: z
    .string({ error: "O CPF é obrigatório" })
    .regex(/^\d{11}$/, "O CPF deve conter exatamente 11 números (apenas dígitos)")
    .openapi({ example: "12345678901" }),

  telefone: z
    .string({ error: "O telefone é obrigatório" })
    .min(10, "O telefone deve ter pelo menos 10 dígitos")
    .max(15, "O telefone deve ter no máximo 15 dígitos")
    .openapi({ example: "79999998888" }),

  email: z
    .email("E-mail com formato inválido")
    .nullable()
    .optional()
    .openapi({ example: "maria@clinica.com" }),
});

export type SecretarioInput = z.infer<typeof secretarioSchema>;
