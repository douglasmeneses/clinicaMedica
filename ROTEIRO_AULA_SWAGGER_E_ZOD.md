# 📘 Roteiro de Aula: Validações com ZOD e Documentação Automática com SWAGGER

> **Objetivo da Aula:**  
> Aprender a proteger nossa API contra dados inválidos usando **Zod** e gerar uma documentação interativa com **Swagger (OpenAPI 3.0)** **diretamente dos schemas do Zod**, mantendo nossas rotas 100% limpas (sem blocos gigantescos de comentários YAML!).

---

## 🎯 Por que precisamos de Zod e Swagger?

Imagine que nossa API de Clínica Médica está no ar:
1. **Sem validação:** Um usuário envia um cadastro de consulta com o turno `"noite"`, a data `"ontem"` ou sem o ID do médico. O que acontece? O erro estoura no banco de dados ou grava dados corrompidos.
2. **Sem documentação:** Quem for consumir nossa API (como devs de Frontend ou Mobile) não sabe quais campos são obrigatórios nem quais rotas existem.

Com **Zod** + **Swagger Automático**:
- **Zod:** Funciona como um segurança na porta. Se o dado não estiver no formato exato, ele barra na hora com erro HTTP 400 amigável.
- **Swagger UI:** Cria uma página interativa no navegador (`http://localhost:3000/docs`) para testar os endpoints com o botão **"Try it out"**.
- **Zod-to-OpenAPI:** O Zod vira a **única fonte da verdade**. Não precisamos redigitar campos e tipos no Swagger; ele lê o Zod e gera a documentação sozinho!

---

## 📦 Passo 1: Instalação das Dependências

No terminal da pasta do projeto, execute:

```bash
npm install swagger-ui-express @asteasolutions/zod-to-openapi
npm install --save-dev @types/swagger-ui-express
```

*(O pacote `zod` já está instalado no projeto).*

### O que cada biblioteca faz?
- **`zod`**: Declara as regras de validação dos dados de entrada.
- **`@asteasolutions/zod-to-openapi`**: Lê os schemas do Zod e gera a especificação OpenAPI 3.0 automaticamente, eliminando centenas de linhas de YAML manual.
- **`swagger-ui-express`**: Renderiza a interface web bonita e interativa do Swagger no Express.

---

## 🛡️ PARTE 1: Validação de Dados com ZOD

### 1.1 Entendendo o Conceito do Zod
No Zod, nós criamos um **Schema** (molde). Depois, pedimos para o Zod verificar se o dado recebido bate com o molde:
- Se bater, os dados são liberados e tipados.
- Se não bater, o Zod devolve uma lista exata de quais campos estão errados e o porquê.

---

### 1.2 Criando os Schemas de Validação

Crie o arquivo: `src/schemas/secretarioSchema.ts`

```typescript
import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

// Permite adicionar exemplos e descrições do Swagger direto no Zod!
extendZodWithOpenApi(z);

export const secretarioSchema = z.object({
  // Nome obrigatório entre 3 e 100 caracteres
  nome: z
    .string({ error: "O nome é obrigatório" })
    .min(3, "O nome deve ter pelo menos 3 caracteres")
    .max(100, "O nome deve ter no máximo 100 caracteres")
    .openapi({ example: "Maria Oliveira" }),

  // CPF com exatamente 11 dígitos numéricos
  cpf: z
    .string({ error: "O CPF é obrigatório" })
    .regex(/^\d{11}$/, "O CPF deve conter exatamente 11 números (apenas dígitos)")
    .openapi({ example: "12345678901" }),

  // Telefone entre 10 e 15 dígitos
  telefone: z
    .string({ error: "O telefone é obrigatório" })
    .min(10, "O telefone deve ter pelo menos 10 dígitos")
    .max(15, "O telefone deve ter no máximo 15 dígitos")
    .openapi({ example: "79999998888" }),

  // Email opcional com validação nativa de formato
  email: z
    .email("E-mail com formato inválido")
    .nullable()
    .optional()
    .openapi({ example: "maria@clinica.com" }),
});

// SUPER PODER: O Zod gera o tipo TypeScript automaticamente!
export type SecretarioInput = z.infer<typeof secretarioSchema>;
```

#### 🔍 Explicando linha por linha:
1. `extendZodWithOpenApi(z)`: Habilita a função `.openapi()` no Zod para definir exemplos que vão direto para a documentação.
2. `z.object({...})`: Define um objeto JSON esperado.
3. `.min(3)` / `.max(100)`: Limites de tamanho do texto.
4. `.regex(/^\d{11}$/)`: Expressão regular exigindo exatamente 11 dígitos numéricos.
5. `z.email(...)`: Validador nativo de e-mail.
6. `z.infer<typeof secretarioSchema>`: Extrai a tipagem TypeScript diretamente das regras do Zod. Se você alterar a regra, o TypeScript atualiza sozinho!

---

Agora crie o arquivo: `src/schemas/consultaSchema.ts`

```typescript
import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const consultaSchema = z.object({
  // Data no formato DD/MM/AAAA
  data: z
    .string({ error: "A data da consulta é obrigatória" })
    .regex(
      /^\d{2}\/\d{2}\/\d{4}$/,
      "A data deve estar no formato DD/MM/AAAA (exemplo: 15/10/2026)"
    )
    .openapi({ example: "15/10/2026", description: "Data no formato DD/MM/AAAA" }),

  // Turno: apenas "M" ou "T"
  turno: z
    .enum(["M", "T"] as const, {
      error: "O turno deve ser apenas 'M' (Manhã) ou 'T' (Tarde)",
    })
    .openapi({ example: "M", description: "Turno: M (Manhã) ou T (Tarde)" }),

  // IDs como números inteiros positivos
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
```

---

### 1.3 Criando o Middleware Reutilizável de Validação

Em vez de repetir validações em cada controller, criamos um **Middleware** do Express. Ele intercepta a requisição **antes** do Controller. Se estiver errado, responde HTTP 400 imediatamente!

Crie o arquivo: `src/middlewares/validarSchema.ts`

```typescript
import type { Request, Response, NextFunction } from "express";
import { type ZodType } from "zod";

/**
 * Middleware genérico que valida o corpo da requisição (req.body)
 */
export function validarBody(schema: ZodType) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // safeParseAsync valida sem precisar de bloco try/catch
    const resultado = await schema.safeParseAsync(req.body);

    if (!resultado.success) {
      // Formata a lista de erros em um formato amigável para o front
      const errosFormatados = resultado.error.issues.map((issue) => ({
        campo: issue.path.join("."),
        mensagem: issue.message,
      }));

      return res.status(400).json({
        status: "erro_validacao",
        mensagem: "Os dados enviados são inválidos",
        detalhes: errosFormatados,
      });
    }

    // Injeta os dados limpos e validados no req.body
    req.body = resultado.data;
    return next();
  };
}
```

---

### 1.4 Aplicando o Middleware nas Rotas (Código 100% Limpo!)

Veja como as rotas ficam enxutas e legíveis:

Edite `src/routes/secretarioRoutes.ts`:

```typescript
import Router from "express";
import * as controller from "../controllers/secretarioController.js";
import { validarBody } from "../middlewares/validarSchema.js";
import { secretarioSchema } from "../schemas/secretarioSchema.js";

const router = Router();

router.get("/secretarios", controller.listar);
router.get("/secretarios/:id", controller.buscarPorId);

// 🔒 Rotas protegidas pelo Zod:
router.post("/secretarios", validarBody(secretarioSchema), controller.cadastrar);
router.put("/secretarios/:id", validarBody(secretarioSchema), controller.atualizar);

router.delete("/secretarios/:id", controller.deletar);

export default router;
```

Edite `src/routes/consultaRoutes.ts`:

```typescript
import Router from "express";
import * as controller from "../controllers/consultaController.js";
import { validarBody } from "../middlewares/validarSchema.js";
import { consultaSchema } from "../schemas/consultaSchema.js";

const router = Router();

router.get("/consultas", controller.listar);
router.get("/consultas/:id", controller.buscarPorId);

// 🔒 Rotas protegidas pelo Zod:
router.post("/consultas", validarBody(consultaSchema), controller.cadastrar);
router.put("/consultas/:id", validarBody(consultaSchema), controller.atualizar);

router.delete("/consultas/:id", controller.deletar);

export default router;
```

---

## 📖 PARTE 2: Documentação com SWAGGER (Sem Repetição de Código!)

Em vez de escrever centenas de linhas de comentários YAML em cima das rotas, nós usamos o `OpenAPIRegistry` para ler os schemas do Zod e gerar o Swagger em TypeScript puro.

### 2.1 Configurando o Gerador OpenAPI

Crie o arquivo: `src/config/swagger.ts`

```typescript
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
// 1. Modelos registrados direto do Zod!
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
      description: "Lista de secretários",
      content: { "application/json": { schema: z.array(SecretarioModel) } },
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
      id: z.coerce.number().openapi({ example: 1 }),
    }),
  },
  responses: {
    200: {
      description: "Secretário encontrado",
      content: { "application/json": { schema: SecretarioModel } },
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
      content: { "application/json": { schema: secretarioSchema } },
    },
  },
  responses: {
    201: {
      description: "Secretário cadastrado com sucesso",
      content: { "application/json": { schema: SecretarioModel } },
    },
    400: { description: "Erro de validação" },
  },
});

registry.registerPath({
  method: "put",
  path: "/secretarios/{id}",
  summary: "Atualiza os dados de um secretário",
  tags: ["Secretários"],
  request: {
    params: z.object({ id: z.coerce.number().openapi({ example: 1 }) }),
    body: {
      content: { "application/json": { schema: secretarioSchema } },
    },
  },
  responses: {
    200: {
      description: "Secretário atualizado com sucesso",
      content: { "application/json": { schema: SecretarioModel } },
    },
    404: { description: "Secretário não encontrado" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/secretarios/{id}",
  summary: "Remove um secretário por ID",
  tags: ["Secretários"],
  request: {
    params: z.object({ id: z.coerce.number().openapi({ example: 1 }) }),
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
      content: { "application/json": { schema: z.array(ConsultaModel) } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/consultas/{id}",
  summary: "Busca uma consulta por ID",
  tags: ["Consultas"],
  request: {
    params: z.object({ id: z.coerce.number().openapi({ example: 1 }) }),
  },
  responses: {
    200: {
      description: "Consulta encontrada",
      content: { "application/json": { schema: ConsultaModel } },
    },
    404: { description: "Consulta não encontrada" },
  },
});

registry.registerPath({
  method: "post",
  path: "/consultas",
  summary: "Agenda uma nova consulta",
  description: "Valida turno (M/T), data e limite de 5 pacientes por turno do médico.",
  tags: ["Consultas"],
  request: {
    body: {
      content: { "application/json": { schema: consultaSchema } },
    },
  },
  responses: {
    201: {
      description: "Consulta agendada com sucesso",
      content: { "application/json": { schema: ConsultaModel } },
    },
    400: { description: "Erro de validação ou agenda cheia" },
  },
});

registry.registerPath({
  method: "put",
  path: "/consultas/{id}",
  summary: "Atualiza uma consulta existente",
  tags: ["Consultas"],
  request: {
    params: z.object({ id: z.coerce.number().openapi({ example: 1 }) }),
    body: {
      content: { "application/json": { schema: consultaSchema } },
    },
  },
  responses: {
    200: {
      description: "Consulta atualizada com sucesso",
      content: { "application/json": { schema: ConsultaModel } },
    },
    404: { description: "Consulta não encontrada" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/consultas/{id}",
  summary: "Cancela/remove uma consulta",
  tags: ["Consultas"],
  request: {
    params: z.object({ id: z.coerce.number().openapi({ example: 1 }) }),
  },
  responses: {
    204: { description: "Consulta removida com sucesso" },
    404: { description: "Consulta não encontrada" },
  },
});

// ==========================================
// 4. Gerador do Documento Final
// ==========================================
const generator = new OpenApiGeneratorV3(registry.definitions);

export const swaggerSpec = generator.generateDocument({
  openapi: "3.0.0",
  info: {
    title: "API Clínica Médica",
    version: "1.0.0",
    description: "Documentação automática gerada a partir dos Schemas do Zod.",
  },
  servers: [{ url: "http://localhost:3000", description: "Localhost" }],
});
```

---

### 2.2 Servindo a Documentação no `server.ts`

Edite `src/server.ts`:

```typescript
import express, { type Request, type Response, type NextFunction } from "express";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";

import pacienteRoutes from "./routes/pacienteRoutes.js";
import medicoRoutes from "./routes/medicoRoutes.js";
import secretarioRoutes from "./routes/secretarioRoutes.js";
import consultaRoutes from "./routes/consultaRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());

const PORT: number = Number(process.env.PORT || 3000);

// 📄 Interface visual do Swagger:
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rotas da API
app.use(pacienteRoutes);
app.use(medicoRoutes);
app.use(secretarioRoutes);
app.use(consultaRoutes);

// Middleware global de tratamento de erros
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  return res.status(400).json({ mensagem: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 A API subiu na porta ${PORT}`);
  console.log(`📚 Documentação disponível em: http://localhost:${PORT}/docs`);
});
```

---

## 🧪 PARTE 3: Testando em Sala de Aula

### Teste 1: Acessar a Documentação
1. Suba o servidor:
   ```bash
   npm run dev
   ```
2. Abra no navegador:
   ```
   http://localhost:3000/docs
   ```
3. Veja todos os endpoints agrupados por tags, com exemplos preenchidos automaticamente do Zod e o botão **"Try it out"** funcionando!

---

### Teste 2: Zod barrando dados inválidos
Faça um `POST /consultas` enviando:
```json
{
  "data": "amanha",
  "turno": "noite",
  "medicoId": -5,
  "pacienteId": "dois"
}
```

**Resposta (HTTP 400):**
```json
{
  "status": "erro_validacao",
  "mensagem": "Os dados enviados são inválidos",
  "detalhes": [
    {
      "campo": "data",
      "mensagem": "A data deve estar no formato DD/MM/AAAA (exemplo: 15/10/2026)"
    },
    {
      "campo": "turno",
      "mensagem": "O turno deve ser apenas 'M' (Manhã) ou 'T' (Tarde)"
    },
    {
      "campo": "medicoId",
      "mensagem": "O ID do médico deve ser maior que zero"
    },
    {
      "campo": "pacienteId",
      "mensagem": "Expected number, received string"
    }
  ]
}
```

---

## 📋 Comparativo: Por que essa abordagem é superior?

| Critério | Abordagem Antiga (`swagger-jsdoc`) | Nova Abordagem (`zod-to-openapi`) |
| :--- | :--- | :--- |
| **Arquivos de rotas** | Poluídos com 80+ linhas de YAML por arquivo | **100% limpos** (apenas código Express puro) |
| **Duplicação** | Você digita o campo no Zod e redigita no YAML | **Zero duplicação**: o Zod gera o Swagger |
| **Tipagem e Erros** | YAML em comentários não tem verificação do TypeScript | **Totalmente tipado** com autocompletar do VS Code |
| **Manutenção** | Se mudar uma regra no Zod, precisa lembrar de editar o YAML | Mudou no Zod, atualizou no Swagger automaticamente |
