import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z, type ZodType, type ZodObject } from "zod";
import { secretarioSchema } from "../schemas/secretarioSchema.js";
import { consultaSchema, consultaFiltroSchema } from "../schemas/consultaSchema.js";

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

// -------------------------------------------------------------
// 1. Helpers reutilizáveis (eliminam o boilerplate do OpenAPI)
// -------------------------------------------------------------
const idParam = z.object({
  id: z.coerce.number().openapi({ example: 1, description: "ID numérico" }),
});

const jsonBody = (schema: ZodType) => ({
  content: { "application/json": { schema } },
});

const jsonResponse = (description: string, schema?: ZodType) => ({
  description,
  ...(schema ? jsonBody(schema) : {}),
});

// Helper que registra os 5 endpoints padrão de um CRUD sem repetição de código
function registrarCrud({
  tag,
  path,
  nomeModelo,
  schema,
  queryFiltros,
}: {
  tag: string;
  path: string;
  nomeModelo: string;
  schema: ZodType;
  queryFiltros?: ZodObject<any>;
}) {
  const model = registry.register(
    nomeModelo,
    (schema as any).extend({ id: z.number().openapi({ example: 1 }) })
  );

  // GET /recurso (Listagem)
  registry.registerPath({
    method: "get",
    path,
    summary: `Lista ${tag.toLowerCase()}`,
    tags: [tag],
    ...(queryFiltros ? { request: { query: queryFiltros } } : {}),
    responses: { 200: jsonResponse(`Lista retornada com sucesso`, z.array(model)) },
  });

  // GET /recurso/{id} (Buscar por ID)
  registry.registerPath({
    method: "get",
    path: `${path}/{id}`,
    summary: `Busca ${nomeModelo.toLowerCase()} por ID`,
    tags: [tag],
    request: { params: idParam },
    responses: {
      200: jsonResponse(`${nomeModelo} encontrado`, model),
      404: jsonResponse("Não encontrado"),
    },
  });

  // POST /recurso (Cadastro)
  registry.registerPath({
    method: "post",
    path,
    summary: `Cadastra novo ${nomeModelo.toLowerCase()}`,
    tags: [tag],
    request: { body: jsonBody(schema) },
    responses: {
      201: jsonResponse("Cadastrado com sucesso", model),
      400: jsonResponse("Erro de validação"),
    },
  });

  // PUT /recurso/{id} (Atualização)
  registry.registerPath({
    method: "put",
    path: `${path}/{id}`,
    summary: `Atualiza ${nomeModelo.toLowerCase()}`,
    tags: [tag],
    request: { params: idParam, body: jsonBody(schema) },
    responses: {
      200: jsonResponse("Atualizado com sucesso", model),
      400: jsonResponse("Dados inválidos"),
      404: jsonResponse("Não encontrado"),
    },
  });

  // DELETE /recurso/{id} (Remoção)
  registry.registerPath({
    method: "delete",
    path: `${path}/{id}`,
    summary: `Remove ${nomeModelo.toLowerCase()}`,
    tags: [tag],
    request: { params: idParam },
    responses: {
      204: jsonResponse("Removido com sucesso"),
      404: jsonResponse("Não encontrado"),
    },
  });

  return model;
}

// -------------------------------------------------------------
// 2. Registro declarativo de cada recurso (1 chamada por CRUD!)
// -------------------------------------------------------------
registrarCrud({
  tag: "Secretários",
  path: "/secretarios",
  nomeModelo: "Secretario",
  schema: secretarioSchema,
});

registrarCrud({
  tag: "Consultas",
  path: "/consultas",
  nomeModelo: "Consulta",
  schema: consultaSchema,
  queryFiltros: consultaFiltroSchema,
});

// -------------------------------------------------------------
// 3. Gerador do Documento OpenAPI 3.0
// -------------------------------------------------------------
const generator = new OpenApiGeneratorV3(registry.definitions);

export const swaggerSpec = generator.generateDocument({
  openapi: "3.0.0",
  info: {
    title: "API Clínica Médica",
    version: "1.0.0",
    description: "Documentação automática gerada a partir dos Schemas do Zod.",
  },
  servers: [{ url: "http://localhost:3000", description: "Servidor Local" }],
});
