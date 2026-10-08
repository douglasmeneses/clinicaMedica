import { z } from "zod";

export const consultaSchema = z.object({
  data: z
    .string({ error: "A data da consulta é obrigatória" })
    .regex(
      /^\d{2}\/\d{2}\/\d{4}$/,
      "A data deve estar no formato DD/MM/AAAA (exemplo: 15/10/2026)"
    ),

  turno: z.enum(["M", "T"] as const, {
    error: "O turno deve ser apenas 'M' (Manhã) ou 'T' (Tarde)",
  }),

  medicoId: z
    .number({ error: "O ID do médico é obrigatório" })
    .int("O ID do médico deve ser um número inteiro")
    .positive("O ID do médico deve ser maior que zero"),

  pacienteId: z
    .number({ error: "O ID do paciente é obrigatório" })
    .int("O ID do paciente deve ser um número inteiro")
    .positive("O ID do paciente deve ser maior que zero"),
});

export type ConsultaInput = z.infer<typeof consultaSchema>;
