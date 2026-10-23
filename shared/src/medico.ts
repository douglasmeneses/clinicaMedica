import { z } from "zod";

export const medicoSchema = z.object({
  nome: z
    .string({ error: "O nome é obrigatório" })
    .min(3, "O nome deve ter pelo menos 3 caracteres")
    .max(100, "O nome deve ter no máximo 100 caracteres")
    .meta({ example: "Dra. Ana Souza" }),

  crm: z
    .string({ error: "O CRM é obrigatório" })
    .min(4, "O CRM deve ter pelo menos 4 caracteres")
    .max(20, "O CRM deve ter no máximo 20 caracteres")
    .meta({ example: "CRM-SE-123456" }),

  especialidade: z
    .string({ error: "A especialidade é obrigatória" })
    .min(3, "A especialidade deve ter pelo menos 3 caracteres")
    .max(60, "A especialidade deve ter no máximo 60 caracteres")
    .meta({ example: "Cardiologia" }),
});

export type MedicoInput = z.infer<typeof medicoSchema>;
