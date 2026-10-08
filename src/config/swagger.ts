import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { secretarioSchema } from "../schemas/secretarioSchema.js";
import { consultaSchema } from "../schemas/consultaSchema.js";

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

// ==========================================
// 1. Modelos registrados a partir do Zod
// ==========================================
const SecretarioModel = registry.register(
  "Secretario",
  secretarioSchema.extend({
    id: z.number().openapi({ example: 1 }),
  })
);

const ConsultaModel = registry.register(
  "Consulta",
  consultaSchema.extend({
    id: z.number().openapi({ example: 1 }),
  })
);

// ==========================================
// 2. Rotas de Secretários
// ==========================================
registry.registerPath({
  method: "get",
  path: "/secretarios",
  summary: "Lista todos os secretários",
  tags: ["Secretários"],
  responses: {
    200: {
      description: "Lista de secretários retornada com sucesso",
      content: {
        "application/json": {
          schema: z.array(SecretarioModel),
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/secretarios/{id}",
  summary: "Busca um secretário por ID",
  tags: ["Secretários"],
  request: {
    params: z.object({
      id: z.coerce.number().openapi({ example: 1, description: "ID do secretário" }),
    }),
  },
  responses: {
    200: {
      description: "Secretário encontrado",
      content: {
        "application/json": {
          schema: SecretarioModel,
        },
      },
    },
    404: { description: "Secretário não encontrado" },
  },
});

registry.registerPath({
  method: "post",
  path: "/secretarios",
  summary: "Cadastra um novo secretário",
  tags: ["Secretários"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: secretarioSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Secretário cadastrado com sucesso",
      content: {
        "application/json": {
          schema: SecretarioModel,
        },
      },
    },
    400: { description: "Erro de validação de dados" },
  },
});

registry.registerPath({
  method: "put",
  path: "/secretarios/{id}",
  summary: "Atualiza os dados de um secretário",
  tags: ["Secretários"],
  request: {
    params: z.object({
      id: z.coerce.number().openapi({ example: 1 }),
    }),
    body: {
      content: {
        "application/json": {
          schema: secretarioSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Secretário atualizado com sucesso",
      content: {
        "application/json": {
          schema: SecretarioModel,
        },
      },
    },
    400: { description: "Dados inválidos" },
    404: { description: "Secretário não encontrado" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/secretarios/{id}",
  summary: "Remove um secretário por ID",
  tags: ["Secretários"],
  request: {
    params: z.object({
      id: z.coerce.number().openapi({ example: 1 }),
    }),
  },
  responses: {
    204: { description: "Secretário removido com sucesso" },
    404: { description: "Secretário não encontrado" },
  },
});

// ==========================================
// 3. Rotas de Consultas
// ==========================================
registry.registerPath({
  method: "get",
  path: "/consultas",
  summary: "Lista consultas (com filtros opcionais)",
  tags: ["Consultas"],
  request: {
    query: z.object({
      medicoId: z.coerce.number().optional().openapi({ example: 1 }),
      pacienteId: z.coerce.number().optional().openapi({ example: 1 }),
      data: z.string().optional().openapi({ example: "15/10/2026" }),
      turno: z.enum(["M", "T"] as const).optional().openapi({ example: "M" }),
    }),
  },
  responses: {
    200: {
      description: "Lista de consultas",
      content: {
        "application/json": {
          schema: z.array(ConsultaModel),
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/consultas/{id}",
  summary: "Busca uma consulta por ID",
  tags: ["Consultas"],
  request: {
    params: z.object({
      id: z.coerce.number().openapi({ example: 1 }),
    }),
  },
  responses: {
    200: {
      description: "Consulta encontrada",
      content: {
        "application/json": {
          schema: ConsultaModel,
        },
      },
    },
    404: { description: "Consulta não encontrada" },
  },
});

registry.registerPath({
  method: "post",
  path: "/consultas",
  summary: "Agenda uma nova consulta",
  description: "Valida turno (M/T), data (DD/MM/AAAA) e limite de 5 pacientes por turno.",
  tags: ["Consultas"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: consultaSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Consulta agendada com sucesso",
      content: {
        "application/json": {
          schema: ConsultaModel,
        },
      },
    },
    400: { description: "Erro de validação ou agenda lotada/conflito" },
  },
});

registry.registerPath({
  method: "put",
  path: "/consultas/{id}",
  summary: "Atualiza uma consulta existente",
  tags: ["Consultas"],
  request: {
    params: z.object({
      id: z.coerce.number().openapi({ example: 1 }),
    }),
    body: {
      content: {
        "application/json": {
          schema: consultaSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Consulta atualizada com sucesso",
      content: {
        "application/json": {
          schema: ConsultaModel,
        },
      },
    },
    400: { description: "Dados inválidos" },
    404: { description: "Consulta não encontrada" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/consultas/{id}",
  summary: "Cancela/remove uma consulta",
  tags: ["Consultas"],
  request: {
    params: z.object({
      id: z.coerce.number().openapi({ example: 1 }),
    }),
  },
  responses: {
    204: { description: "Consulta removida com sucesso" },
    404: { description: "Consulta não encontrada" },
  },
});

// ==========================================
// 4. Gerador da Documentação OpenAPI 3.0
// ==========================================
const generator = new OpenApiGeneratorV3(registry.definitions);

export const swaggerSpec = generator.generateDocument({
  openapi: "3.0.0",
  info: {
    title: "API Clínica Médica",
    version: "1.0.0",
    description:
      "Documentação interativa gerada automaticamente a partir dos Schemas do Zod.",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Servidor Local de Desenvolvimento",
    },
  ],
});
