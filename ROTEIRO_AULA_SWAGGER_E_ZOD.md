# 📘 Roteiro de Aula: Validações com ZOD e Documentação Interativa com SWAGGER

> **Objetivo da Aula:**  
> Aprender a proteger nossa API contra dados inválidos usando a biblioteca **Zod** e criar uma documentação interativa, profissional e testável diretamente pelo navegador utilizando o **Swagger (OpenAPI)**.

---

## 🎯 Por que precisamos de Zod e Swagger?

Imagine que nossa API de Clínica Médica está no ar:
1. **Sem validação:** Um usuário envia um cadastro de consulta com o turno `"noite"`, a data `"ontem"` ou sem o ID do médico. O que acontece? O erro vai estourar lá no banco de dados ou criar dados corrompidos.
2. **Sem documentação:** O desenvolvedor frontend (ou quem for consumir nossa API) não sabe quais campos são obrigatórios, quais rotas existem, nem qual formato enviar. Ele precisa ficar abrindo o código da API para adivinhar.

Com **Zod** + **Swagger**:
- **Zod:** Funciona como um "segurança na porta da balada" (middleware). Se o dado não estiver no formato exato, ele barra na hora com uma mensagem clara (HTTP 400).
- **Swagger:** Cria uma página web visual bonita (`http://localhost:3000/docs`) onde qualquer pessoa pode ver as rotas, os exemplos e até clicar em **"Try it out"** para testar as requisições sem precisar abrir o Postman ou Insomnia.

---

## 📦 Passo 1: Instalação das Dependências

No terminal da pasta do projeto, execute o comando para instalar as ferramentas do Swagger (o `zod` já está instalado no projeto):

```bash
npm install swagger-ui-express swagger-jsdoc
npm install --save-dev @types/swagger-ui-express @types/swagger-jsdoc
```

### O que cada biblioteca faz?
- **`zod`**: Biblioteca TypeScript-first para declarar esquemas de validação de dados.
- **`swagger-ui-express`**: Cria a interface gráfica (a página web com visual amigável) do Swagger no Express.
- **`swagger-jsdoc`**: Lê comentários especiais no código e gera automaticamente o arquivo de especificação OpenAPI (JSON/YAML).
- **`@types/...`**: Tipagens TypeScript para termos autocompletar e verificação de erros no VS Code.

---

## 🛡️ PARTE 1: Validação de Dados com ZOD

### 1.1 Entendendo o Conceito do Zod
No Zod, nós criamos um **Schema** (molde). Depois, pedimos para o Zod verificar se o dado recebido bate com o molde:
- Se bater, os dados são liberados e tipados.
- Se não bater, o Zod devolve uma lista exata de quais campos estão errados e o porquê.

---

### 1.2 Criando os Schemas de Validação

Vamos criar uma pasta `src/schemas` para centralizar as regras de validação.

Crie o arquivo: `src/schemas/secretarioSchema.ts`

```typescript
import { z } from "zod";

// Definimos as regras para cadastrar ou atualizar um Secretário
export const secretarioSchema = z.object({
  // O nome deve ser string, ter no mínimo 3 letras e no máximo 100
  nome: z
    .string({ error: "O nome é obrigatório" })
    .min(3, "O nome deve ter pelo menos 3 caracteres")
    .max(100, "O nome deve ter no máximo 100 caracteres"),

  // O CPF deve ser string e ter exatamente 11 dígitos numéricos
  cpf: z
    .string({ error: "O CPF é obrigatório" })
    .regex(/^\d{11}$/, "O CPF deve conter exatamente 11 números (apenas dígitos)"),

  // Telefone deve ter entre 10 e 15 dígitos
  telefone: z
    .string({ error: "O telefone é obrigatório" })
    .min(10, "O telefone deve ter pelo menos 10 dígitos")
    .max(15, "O telefone deve ter no máximo 15 dígitos"),

  // Email é opcional, mas se for enviado, precisa ter formato de e-mail válido
  email: z
    .string()
    .email("E-mail com formato inválido")
    .nullable()
    .optional(),
});

// SUPER PODER DO ZOD:
// Em vez de criar a interface TypeScript na mão, o Zod gera para nós automaticamente!
export type SecretarioInput = z.infer<typeof secretarioSchema>;
```

#### 🔍 Explicando linha por linha:
1. `z.object({...})`: Diz que esperamos receber um objeto JSON com chaves e valores.
2. `{ error: "..." }`: Mensagem personalizada se o campo não for enviado no JSON ou for de tipo errado.
3. `.min(3, "...")`: Garante que o texto não seja vazio nem curto demais.
4. `.regex(/^\d{11}$/, "...")`: Expressão regular simples que só aceita números e exige exatamente 11 caracteres.
5. `.email()`: Valida automaticamente se tem `@`, domínio e formato de e-mail.
6. `.nullable().optional()`: O campo pode vir como `null`, `undefined` ou nem ser enviado.
7. `z.infer<typeof secretarioSchema>`: Extrai o tipo TypeScript automaticamente. Assim, se você mudar a validação no Zod, o tipo do TypeScript atualiza sozinho sem você precisar alterar duas vezes!

---

Agora crie o arquivo: `src/schemas/consultaSchema.ts`

```typescript
import { z } from "zod";

export const consultaSchema = z.object({
  // Data no formato string brasileiro: DD/MM/AAAA
  data: z
    .string({ error: "A data da consulta é obrigatória" })
    .regex(
      /^\d{2}\/\d{2}\/\d{4}$/,
      "A data deve estar no formato DD/MM/AAAA (exemplo: 15/10/2026)"
    ),

  // Turno: apenas "M" (Manhã) ou "T" (Tarde)
  turno: z.enum(["M", "T"] as const, {
    error: "O turno deve ser apenas 'M' (Manhã) ou 'T' (Tarde)",
  }),

  // IDs precisam ser números inteiros positivos
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
```

#### 🔍 Explicando os novos pontos:
- `z.enum(["M", "T"] as const)`: Garante que **apenas** as opções `"M"` ou `"T"` sejam aceitas. Se alguém mandar `"manha"`, `"tarde"` ou `"N"`, o Zod rejeita imediatamente!
- `z.number().int().positive()`: Impede que passem texto, números decimais (`1.5`) ou números negativos (`-3`).

---

### 1.3 Criando o Middleware Reutilizável de Validação

Em vez de colocar `try/catch` de validação em cada controller, vamos criar um **Middleware** do Express. 

O que é um Middleware?  
É uma função intermediária que intercepta a requisição **antes** dela chegar no Controller. Se os dados forem válidos, ela chama `next()` e deixa passar. Se forem inválidos, ela responde com erro 400 e **nem chega a rodar o Controller**.

Crie o arquivo: `src/middlewares/validarSchema.ts`

```typescript
import type { Request, Response, NextFunction } from "express";
import { ZodError, type ZodSchema } from "zod";

/**
 * Middleware que recebe um schema do Zod e valida o corpo (req.body) da requisição.
 */
export function validarBody(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // safeParse analisa os dados sem lançar exceções inesperadas
      const resultado = await schema.parseAsync(req.body);
      
      // Substitui o req.body pelos dados limpos e validados pelo Zod
      req.body = resultado;
      
      // Tudo certo! Passa para o próximo passo (o controller)
      return next();
    } catch (erro) {
      // Se o erro veio do Zod, formatamos para ficar bem amigável
      if (erro instanceof ZodError) {
        const errosFormatados = erro.issues.map((issue) => ({
          campo: issue.path.join("."),
          mensagem: issue.message,
        }));

        return res.status(400).json({
          status: "erro_validacao",
          mensagem: "Os dados enviados são inválidos",
          detalhes: errosFormatados,
        });
      }

      // Se for outro erro, passa para o tratador global de erros
      return next(erro);
    }
  };
}
```

#### 🔍 Explicando o fluxo:
1. `validarBody(schema)`: É uma função que devolve um middleware configurado para o schema desejado (conceito de *Factory*).
2. `schema.parseAsync(req.body)`: Tenta validar o corpo da requisição de forma assíncrona.
3. `erro.issues`: Contém a lista de todos os problemas encontrados. Nós usamos `.map()` para retornar um JSON limpo, dizendo exatamente qual campo falhou e o motivo.

---

### 1.4 Aplicando o Middleware nas Rotas

Agora veja como é simples proteger nossas rotas. Basta adicionar `validarBody(...)` antes do controller!

Edite `src/routes/secretarioRoutes.ts`:

```typescript
import Router from "express";
import * as controller from "../controllers/secretarioController.js";
import { validarBody } from "../middlewares/validarSchema.js";
import { secretarioSchema } from "../schemas/secretarioSchema.js";

const router = Router();

router.get("/secretarios", controller.listar);
router.get("/secretarios/:id", controller.buscarPorId);

// 🔒 Rota protegida: se os dados forem inválidos, o controller nem é executado!
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

// 🔒 Rota protegida: valida formato de data, turno M/T e IDs de médico e paciente
router.post("/consultas", validarBody(consultaSchema), controller.cadastrar);
router.put("/consultas/:id", validarBody(consultaSchema), controller.atualizar);

router.delete("/consultas/:id", controller.deletar);

export default router;
```

---

## 📖 PARTE 2: Documentação com SWAGGER (OpenAPI 3.0)

### 2.1 O que é o OpenAPI e o Swagger?
- **OpenAPI**: É o padrão mundial que descreve como uma API REST funciona (rotas, métodos HTTP, parâmetros, códigos de status).
- **Swagger UI**: É a aplicação que lê esse padrão e renderiza uma página interativa no navegador.

---

### 2.2 Configurando o Swagger

Vamos criar um arquivo para configurar as opções do Swagger.

Crie o arquivo: `src/config/swagger.ts`

```typescript
import swaggerJSDoc, { type Options } from "swagger-jsdoc";

const swaggerOptions: Options = {
  definition: {
    openapi: "3.0.0", // Versão da especificação OpenAPI
    info: {
      title: "API Clínica Médica",
      version: "1.0.0",
      description:
        "Documentação oficial da API de gerenciamento da Clínica Médica, com suporte a consultas, médicos, pacientes e secretários.",
      contact: {
        name: "Suporte da Clínica",
        email: "contato@clinicamedica.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Servidor Local de Desenvolvimento",
      },
    ],
  },
  // Onde estão os arquivos que contêm os comentários da documentação?
  // O swagger-jsdoc vai ler todos os arquivos dentro de src/routes/
  apis: ["./src/routes/*.ts", "./dist/routes/*.js"],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);
```

#### 🔍 Explicando os campos:
- `openapi: "3.0.0"`: Informa que usamos a versão moderna do padrão.
- `info`: Título, versão e descrição que aparecem no topo da página do Swagger.
- `servers`: As URLs onde a API pode ser executada.
- `apis`: Uma lista de caminhos (glob) indicando onde o Swagger deve procurar as anotações nos comentários do código.

---

### 2.3 Plugando o Swagger no Servidor

Agora vamos servir a página do Swagger em `src/server.ts`.

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

// 📄 Rota do Swagger: Acesse http://localhost:3000/docs no seu navegador!
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rotas da aplicação
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

### 2.4 Documentando as Rotas com Anotações JSDoc

O `swagger-jsdoc` lê blocos de comentários que começam com `/** @openapi` (ou `/** @swagger`).

Vamos ver como fica o arquivo `src/routes/secretarioRoutes.ts` documentado:

```typescript
import Router from "express";
import * as controller from "../controllers/secretarioController.js";
import { validarBody } from "../middlewares/validarSchema.js";
import { secretarioSchema } from "../schemas/secretarioSchema.js";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Secretario:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nome:
 *           type: string
 *           example: Maria Oliveira
 *         cpf:
 *           type: string
 *           example: "12345678901"
 *         telefone:
 *           type: string
 *           example: "79999998888"
 *         email:
 *           type: string
 *           example: maria@clinica.com
 *     SecretarioInput:
 *       type: object
 *       required:
 *         - nome
 *         - cpf
 *         - telefone
 *       properties:
 *         nome:
 *           type: string
 *           example: Maria Oliveira
 *         cpf:
 *           type: string
 *           example: "12345678901"
 *         telefone:
 *           type: string
 *           example: "79999998888"
 *         email:
 *           type: string
 *           example: maria@clinica.com
 */

/**
 * @openapi
 * /secretarios:
 *   get:
 *     summary: Lista todos os secretários
 *     tags:
 *       - Secretários
 *     responses:
 *       200:
 *         description: Lista retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Secretario'
 */
router.get("/secretarios", controller.listar);

/**
 * @openapi
 * /secretarios/{id}:
 *   get:
 *     summary: Busca um secretário pelo ID
 *     tags:
 *       - Secretários
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID numérico do secretário
 *     responses:
 *       200:
 *         description: Secretário encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Secretario'
 *       404:
 *         description: Secretário não encontrado
 */
router.get("/secretarios/:id", controller.buscarPorId);

/**
 * @openapi
 * /secretarios:
 *   post:
 *     summary: Cadastra um novo secretário
 *     tags:
 *       - Secretários
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SecretarioInput'
 *     responses:
 *       201:
 *         description: Secretário cadastrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Secretario'
 *       400:
 *         description: Erro de validação de dados (Zod)
 */
router.post("/secretarios", validarBody(secretarioSchema), controller.cadastrar);

/**
 * @openapi
 * /secretarios/{id}:
 *   put:
 *     summary: Atualiza os dados de um secretário
 *     tags:
 *       - Secretários
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SecretarioInput'
 *     responses:
 *       200:
 *         description: Secretário atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Secretário não encontrado
 */
router.put("/secretarios/:id", validarBody(secretarioSchema), controller.atualizar);

/**
 * @openapi
 * /secretarios/{id}:
 *   delete:
 *     summary: Remove um secretário pelo ID
 *     tags:
 *       - Secretários
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Secretário removido com sucesso (sem conteúdo)
 *       404:
 *         description: Secretário não encontrado
 */
router.delete("/secretarios/:id", controller.deletar);

export default router;
```

#### 🔍 Entendendo a Sintaxe do Swagger YAML:
- **`components.schemas`**: Modelos reutilizáveis. Criamos `Secretario` (com ID) e `SecretarioInput` (dados que o usuário envia no POST).
- **`tags`**: Agrupa as rotas visualmente por entidade no painel (ex: todas as rotas de Secretários ficam juntas).
- **`summary`**: Uma linha curta explicando o que a rota faz.
- **`parameters`**: Parâmetros de rota (como `:id` no caminho `/secretarios/{id}`) ou query parameters (como `?data=...`).
- **`requestBody`**: O que deve ser enviado no corpo da requisição (JSON).
- **`responses`**: Os códigos de resposta esperados (200, 201, 204, 400, 404).
- **`$ref`**: Referência a um schema definido em `components` para não precisar repetir propriedades em todo lugar.

---

### 2.5 Documentando as Rotas de Consultas

Agora veja `src/routes/consultaRoutes.ts` com a documentação do Swagger e as regras de negócio:

```typescript
import Router from "express";
import * as controller from "../controllers/consultaController.js";
import { validarBody } from "../middlewares/validarSchema.js";
import { consultaSchema } from "../schemas/consultaSchema.js";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     ConsultaInput:
 *       type: object
 *       required:
 *         - data
 *         - turno
 *         - medicoId
 *         - pacienteId
 *       properties:
 *         data:
 *           type: string
 *           example: "15/10/2026"
 *           description: Data no formato DD/MM/AAAA
 *         turno:
 *           type: string
 *           enum: [M, T]
 *           example: "M"
 *           description: "Turno da consulta: 'M' para Manhã ou 'T' para Tarde"
 *         medicoId:
 *           type: integer
 *           example: 1
 *         pacienteId:
 *           type: integer
 *           example: 2
 *     Consulta:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 10
 *         data:
 *           type: string
 *           example: "15/10/2026"
 *         turno:
 *           type: string
 *           example: "M"
 *         medicoId:
 *           type: integer
 *           example: 1
 *         pacienteId:
 *           type: integer
 *           example: 2
 */

/**
 * @openapi
 * /consultas:
 *   get:
 *     summary: Lista consultas (permite filtrar por médico, paciente, data e turno)
 *     tags:
 *       - Consultas
 *     parameters:
 *       - in: query
 *         name: medicoId
 *         schema:
 *           type: integer
 *         description: Filtrar por ID do médico
 *       - in: query
 *         name: pacienteId
 *         schema:
 *           type: integer
 *         description: Filtrar por ID do paciente
 *       - in: query
 *         name: data
 *         schema:
 *           type: string
 *         example: "15/10/2026"
 *         description: Filtrar por data
 *       - in: query
 *         name: turno
 *         schema:
 *           type: string
 *           enum: [M, T]
 *         description: Filtrar por turno (M ou T)
 *     responses:
 *       200:
 *         description: Lista de consultas retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Consulta'
 */
router.get("/consultas", controller.listar);

/**
 * @openapi
 * /consultas/{id}:
 *   get:
 *     summary: Busca uma consulta por ID
 *     tags:
 *       - Consultas
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Consulta encontrada
 *       404:
 *         description: Consulta não encontrada
 */
router.get("/consultas/:id", controller.buscarPorId);

/**
 * @openapi
 * /consultas:
 *   post:
 *     summary: Agenda uma nova consulta
 *     description: Realiza validações de limite de 5 vagas por turno do médico e conflito de horário do paciente.
 *     tags:
 *       - Consultas
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConsultaInput'
 *     responses:
 *       201:
 *         description: Consulta agendada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Consulta'
 *       400:
 *         description: Erro de validação dos dados ou regra de negócio (ex limite de 5 vagas excedido)
 */
router.post("/consultas", validarBody(consultaSchema), controller.cadastrar);

/**
 * @openapi
 * /consultas/{id}:
 *   put:
 *     summary: Atualiza os dados de uma consulta existente
 *     tags:
 *       - Consultas
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConsultaInput'
 *     responses:
 *       200:
 *         description: Consulta atualizada
 *       400:
 *         description: Erro de validação
 *       404:
 *         description: Consulta não encontrada
 */
router.put("/consultas/:id", validarBody(consultaSchema), controller.atualizar);

/**
 * @openapi
 * /consultas/{id}:
 *   delete:
 *     summary: Cancela/remove uma consulta
 *     tags:
 *       - Consultas
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Consulta removida com sucesso
 *       404:
 *         description: Consulta não encontrada
 */
router.delete("/consultas/:id", controller.deletar);

export default router;
```

---

## 🧪 PARTE 3: Testando em Sala de Aula

### Teste 1: Acessar a Documentação
1. Inicie o servidor:
   ```bash
   npm run dev
   ```
2. Abra no navegador:
   ```
   http://localhost:3000/docs
   ```
3. Observe:
   - Os grupos de rotas separados por tags (`Secretários`, `Consultas`).
   - A documentação de cada campo com tipos e exemplos.
   - O botão **Try it out** que permite disparar requisições diretamente pela interface!

---

### Teste 2: O Zod barrando dados inválidos
Abra o Swagger ou o Postman e tente fazer um `POST /consultas` enviando:
```json
{
  "data": "amanha",
  "turno": "noite",
  "medicoId": -5,
  "pacienteId": "dois"
}
```

**Resultado esperado (HTTP 400):**
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
> 💡 **Observe com a turma:** A requisição foi barrada no middleware. O banco de dados e os services ficaram 100% protegidos contra dados inconsistentes!

---

### Teste 3: Requisição Válida
Envie os dados corretos:
```json
{
  "data": "15/10/2026",
  "turno": "M",
  "medicoId": 1,
  "pacienteId": 1
}
```

**Resultado esperado (HTTP 201):**
```json
{
  "id": 1,
  "data": "15/10/2026",
  "turno": "M",
  "medicoId": 1,
  "pacienteId": 1
}
```

---

## 📋 Resumo das Boas Práticas da Aula

| Conceito | Como foi aplicado | Por que é uma boa prática? |
| :--- | :--- | :--- |
| **Fail-Fast (Falhe Rápido)** | Middleware com Zod no início da rota | Evita processamento desnecessário e impede sujeira no banco |
| **Single Source of Truth** | `z.infer<typeof schema>` | O tipo TypeScript e a regra de validação ficam no mesmo lugar |
| **Código Auto-Documentado** | JSDoc + Swagger | A documentação evolui junto com o código e nunca fica defasada |
| **Erros Descritivos** | Formatação das `issues` do Zod | O desenvolvedor frontend sabe exatamente qual campo corrigir |
