import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const consultaSchema = z.object({
  data: z
    .string({ error: "A data da consulta é obrigatória" })
    .regex(
      /^\d{2}\/\d{2}\/\d{4}$/,
      "A data deve estar no formato DD/MM/AAAA (exemplo: 15/10/2026)"
    )
    .openapi({ example: "15/10/2026", description: "Data no formato DD/MM/AAAA" }),

  turno: z
    .enum(["M", "T"] as const, {
      error: "O turno deve ser apenas 'M' (Manhã) ou 'T' (Tarde)",
    })
    .openapi({ example: "M", description: "Turno: M (Manhã) ou T (Tarde)" }),

  medicoId: z
    .number({ error: "O ID do médico é obrigatório" })
    .int("O ID do médico deve ser um número inteiro")
    .positive("O ID do médico deve ser maior que zero")
    .openapi({ example: 1 }),

  pacienteId: z
    .number({ error: "O ID do paciente é obrigatório" })
    .int("O ID do paciente deve ser um número inteiro")
    .positive("O ID do paciente deve ser maior que zero")
    .openapi({ example: 2 }),
});

export type ConsultaInput = z.infer<typeof consultaSchema>;
