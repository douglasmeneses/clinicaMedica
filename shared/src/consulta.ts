import { z } from "zod";

export const consultaSchema = z.object({
  data: z
    .string({ error: "A data da consulta é obrigatória" })
    .regex(
      /^\d{2}\/\d{2}\/\d{4}$/,
      "A data deve estar no formato DD/MM/AAAA (exemplo: 15/10/2026)"
    )
    .meta({ example: "15/10/2026", description: "Data no formato DD/MM/AAAA" }),

  turno: z
    .enum(["M", "T"] as const, {
      error: "O turno deve ser apenas 'M' (Manhã) ou 'T' (Tarde)",
    })
    .meta({ example: "M", description: "Turno: M (Manhã) ou T (Tarde)" }),

  medicoId: z
    .number({ error: "O ID do médico é obrigatório" })
    .int("O ID do médico deve ser um número inteiro")
    .positive("O ID do médico deve ser maior que zero")
    .meta({ example: 1 }),

  pacienteId: z
    .number({ error: "O ID do paciente é obrigatório" })
    .int("O ID do paciente deve ser um número inteiro")
    .positive("O ID do paciente deve ser maior que zero")
    .meta({ example: 2 }),
});

export type ConsultaInput = z.infer<typeof consultaSchema>;

// Schema para os filtros opcionais de consulta na listagem
export const consultaFiltroSchema = z.object({
  medicoId: z.coerce.number().optional().meta({ example: 1 }),
  pacienteId: z.coerce.number().optional().meta({ example: 1 }),
  data: z.string().optional().meta({ example: "15/10/2026" }),
  turno: z.enum(["M", "T"] as const).optional().meta({ example: "M" }),
});

export type ConsultaFiltroInput = z.infer<typeof consultaFiltroSchema>;
