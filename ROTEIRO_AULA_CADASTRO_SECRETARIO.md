# 📘 Roteiro de Aula: Monorepo, Schemas Compartilhados e Tela de Cadastro do Secretário

> **Objetivo da Aula:**
> Transformar o projeto em um **monorepo** com três partes, `api/`, `frontend/` e `shared/`, em que **os mesmos schemas do Zod validam a API e o formulário do React**. No caminho, o secretário passa a ter **senha** (ele será o usuário do sistema) e construímos a **tela de cadastro** com **Mantine**.

---

## 🎯 Onde estamos e para onde vamos

Até aqui a API funcionava sozinha: Express + Prisma + Zod + Swagger. Os alunos fizeram o tutorial do react.dev, então é hora do frontend.

Duas decisões guiam esta aula:

1. **O secretário é o usuário do sistema.** É ele quem vai fazer login e operar a clínica. Antes do login, precisamos conseguir **cadastrar** um secretário com senha. O login fica para a próxima aula.
2. **Uma regra, um lugar.** "CPF tem 11 dígitos" não pode estar escrito uma vez na API e outra no React: um dia alguém muda um lado e esquece o outro. A regra vai morar no pacote `shared/`, e as duas pontas importam de lá.

> **Ponto de partida:** a `main` com o PR #4 mergeado. Com ele, pacientes e médicos já têm schema Zod, validação nas rotas e Swagger, como secretários e consultas.

### Como o projeto fica no final

```text
clinicaMedica/
├── package.json          # raiz: declara os workspaces (api, frontend, shared)
├── package-lock.json     # um lock só para o monorepo inteiro
├── node_modules/         # dependências de todos os workspaces, num lugar só
├── docker-compose.yml
├── shared/               # schemas Zod + tipos usados pela API e pelo front
│   ├── package.json      # nome: @clinica/shared
│   └── src/
│       ├── paciente.ts
│       ├── medico.ts
│       ├── secretario.ts
│       └── consulta.ts
├── api/                  # o backend que já existia
│   ├── .env
│   ├── package.json
│   ├── prisma/
│   └── src/
└── frontend/             # React + Vite + Mantine
    ├── package.json
    └── src/
```

---

## 🧱 PASSO 0: Reorganizando o repositório em workspaces

### 0.1 Movendo o backend para `api/`

Na raiz do projeto:

```bash
mkdir api
git mv src prisma prisma.config.ts package.json tsconfig.json api/
git rm package-lock.json
mv .env api/
rm -rf node_modules dist
```

**O que cada linha faz:**

- `git mv` move os arquivos **avisando o Git** de que é uma movimentação. No histórico, `src/server.ts` vira `api/src/server.ts` e não "um arquivo apagado e outro novo". Com isso, `git log --follow` continua achando a história de cada arquivo.
- `git rm package-lock.json`: com workspaces, o lock passa a ser **um só, na raiz**, e o `npm install` recria esse arquivo.
- `mv .env api/`: o `.env` não está no Git (ele está no `.gitignore`), então movemos com `mv` comum. O Prisma e o `dotenv` procuram o `.env` na pasta onde o comando roda, que agora é `api/`.
- `rm -rf node_modules dist`: o `node_modules` também vai ser recriado na raiz pelo `npm install`.

### 0.2 O `package.json` da raiz

Crie um `package.json` **novo** na raiz:

```json
{
  "name": "clinica-medica",
  "private": true,
  "workspaces": [
    "shared",
    "api",
    "frontend"
  ]
}
```

**O que são workspaces:** é um recurso nativo do npm para guardar vários pacotes num mesmo repositório. Ao rodar `npm install` na raiz, o npm:

1. Instala as dependências de **todos** os workspaces num único `node_modules` da raiz. Se a API e o front usam o mesmo `zod`, ele é baixado uma vez só.
2. Cria **atalhos (symlinks)** dos workspaces dentro de `node_modules`. Por isso a API consegue escrever `import ... from "@clinica/shared/secretario"` como se fosse um pacote baixado do npm, e qualquer alteração em `shared/src` aparece na hora, sem publicar nada.

- `"private": true` impede que alguém publique a raiz no npm por engano.
- A ordem da lista não muda nada no install. Coloquei `shared` primeiro só porque ele é a base dos outros dois.

### 0.3 Renomeando o pacote da API

Em `api/package.json`, troque `"name": "clinicamedica"` por:

```json
"name": "api",
```

**Por quê:** o nome do workspace é usado nos comandos `-w` (por exemplo, `npm run dev -w api`). `clinicamedica` era o nome do projeto inteiro e agora seria confuso.

---

## 📦 PARTE 1: O pacote `shared/`

### 1.1 O `package.json` do shared

Crie `shared/package.json`:

```json
{
  "name": "@clinica/shared",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "exports": {
    "./*": "./src/*.ts"
  },
  "dependencies": {
    "zod": "^4.6.1"
  }
}
```

**Linha por linha:**

- `"name": "@clinica/shared"`: o `@clinica/` é um **escopo**. Ele evita conflito com algum pacote público chamado `shared` e deixa claro, no import, que o código é nosso.
- `"type": "module"`: o pacote usa `import`/`export` (ESM), igual à API.
- `"exports": { "./*": "./src/*.ts" }`: é o **mapa de entradas** do pacote. O `*` é um curinga, então:
  - `import ... from "@clinica/shared/secretario"` abre `shared/src/secretario.ts`;
  - `import ... from "@clinica/shared/paciente"` abre `shared/src/paciente.ts`.

  Assim, cada arquivo do shared é uma entrada independente, e não precisamos de um `index.ts` reexportando tudo.
- `"zod"` em `dependencies`: os schemas usam Zod, então o shared declara essa dependência. Como a API e o front pedem versões compatíveis, o npm instala **uma única cópia** na raiz.

> **Repare:** o shared aponta para arquivos **`.ts`**, não para JavaScript compilado. Não existe "build do shared". Funciona porque cada consumidor sabe ler TypeScript:
> - **API em dev** (`tsx watch`): o `tsx` executa TypeScript direto.
> - **Frontend** (Vite): o Vite transpila TypeScript de qualquer pasta do projeto.
> - **API em produção** (`npm run build` + `npm start`): o Node 24 **remove os tipos** de arquivos `.ts` sozinho (*type stripping*) e executa o shared direto.

### 1.2 O schema do secretário (agora com senha)

Crie `shared/src/secretario.ts`:

```ts
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
```

**O que mudou em relação ao `api/src/schemas/secretarioSchema.ts` antigo, e por quê:**

1. **`.openapi(...)` virou `.meta(...)`.** O `.openapi()` só existe depois de chamar `extendZodWithOpenApi(z)`, uma função do pacote `@asteasolutions/zod-to-openapi`, que é **do backend**. Se o shared usasse `.openapi()`, o frontend teria que instalar uma biblioteca de Swagger só para validar um formulário. O `.meta()` é do **próprio Zod 4**, e o `zod-to-openapi` (v8 em diante) lê o `example` dele do mesmo jeito.
2. **Dois schemas: `secretarioSchema` e `cadastroSecretarioSchema`.** A senha só faz sentido **no cadastro**:
   - o `PUT /secretarios/:id` (atualizar nome, telefone...) não deve exigir nem trocar a senha;
   - o modelo que a API **devolve** nunca deve ter senha.

   O `.extend()` cria um schema novo com todos os campos do original **mais** os novos, sem repetir nada.
3. **Senha entre 8 e 72 caracteres.** O mínimo de 8 é uma regra básica de segurança. O máximo de 72 vem do **bcrypt** (Parte 2), que só considera os primeiros 72 bytes da senha: o que passar disso seria ignorado sem aviso.
4. **E-mail com `z.preprocess`.** Antes era `.nullable().optional()`. Dois problemas apareceram:
   - **No formulário**, o campo de e-mail vazio é a string `""`, e `""` não é um e-mail válido. O usuário não conseguiria deixar o campo em branco.
   - **Na API**, `.optional()` faz o Zod inferir o tipo `string | null | undefined`, mas o Prisma aceita só `string | null`. Com `exactOptionalPropertyTypes: true` no `tsconfig` da API, o TypeScript reclama.

   O `preprocess` roda **antes** da validação: se o valor é `""` ou não veio, ele vira `null`. Depois disso, o campo é validado como "e-mail ou null". Resultado: o tipo inferido é `string | null`, o mesmo do Prisma, e o campo vazio passa.
5. **`type Secretario`**: o formato que a API devolve. O front usa esse tipo para saber o que chega do `POST`.

**Experimente com a turma** (em `api/`, com um arquivo temporário):

```ts
import { cadastroSecretarioSchema } from "@clinica/shared/secretario";
const base = { nome: "Ana Lima", cpf: "12345678901", telefone: "79999998888", senha: "12345678" };
console.log(cadastroSecretarioSchema.parse({ ...base, email: "" }).email);        // null
console.log(cadastroSecretarioSchema.parse(base).email);                          // null
console.log(cadastroSecretarioSchema.safeParse({ ...base, email: "x" }).success); // false
```

### 1.3 Movendo os schemas de paciente, médico e consulta

Os outros três schemas já existem em `api/src/schemas/`. Eles vão para o shared **sem mudar nenhuma regra**:

```bash
git mv api/src/schemas/pacienteSchema.ts shared/src/paciente.ts
git mv api/src/schemas/medicoSchema.ts shared/src/medico.ts
git mv api/src/schemas/consultaSchema.ts shared/src/consulta.ts
```

Em cada um dos três arquivos, faça dois ajustes:

1. Apague as linhas do `extendZodWithOpenApi`: o import e a chamada `extendZodWithOpenApi(z);`.
2. Troque todo `.openapi(` por `.meta(`.

O começo de `shared/src/paciente.ts` fica assim:

```ts
import { z } from "zod";

export const pacienteSchema = z.object({
  nome: z
    .string({ error: "O nome é obrigatório" })
    .min(3, "O nome deve ter pelo menos 3 caracteres")
    .max(100, "O nome deve ter no máximo 100 caracteres")
    .meta({ example: "João da Silva" }),
  // ... cpf e telefone, com o mesmo ajuste
});
```

O resto (regras, mensagens, `consultaFiltroSchema`) fica **idêntico**. Usamos `git mv` para o Git registrar que o arquivo **mudou de lugar**, e não que um foi apagado e outro criado.

### 1.4 Apagando `schemas/` e `types/` da API

```bash
git rm -r api/src/schemas api/src/types   # em schemas/ só sobrou o secretarioSchema.ts, que já recriamos no shared
```

**Por que dá para apagar `types/`:** os arquivos `types/*.ts` tinham interfaces escritas à mão (`PacienteDTO`, `MedicoDTO`...) que **repetiam** os campos do schema. Agora o tipo sai do próprio schema com `z.infer`: se alguém adicionar um campo no schema, o tipo acompanha sozinho.

### 1.5 Atualizando os imports da API

Em todos os arquivos da API que importavam de `../types/...` ou `../schemas/...`, troque o import e o nome do tipo:

| Antes | Depois |
| :--- | :--- |
| `import type { PacienteDTO } from "../types/paciente.js";` | `import type { PacienteInput } from "@clinica/shared/paciente";` |
| `import type { MedicoDTO } from "../types/medico.js";` | `import type { MedicoInput } from "@clinica/shared/medico";` |
| `import type { SecretarioDTO } from "../types/secretario.js";` | `import type { SecretarioInput } from "@clinica/shared/secretario";` |
| `import type { ConsultaDTO } from "../types/consulta.js";` | `import type { ConsultaInput } from "@clinica/shared/consulta";` |
| `from "../schemas/consultaSchema.js"` | `from "@clinica/shared/consulta"` |
| `from "../schemas/secretarioSchema.js"` | `from "@clinica/shared/secretario"` |
| `from "../schemas/pacienteSchema.js"` | `from "@clinica/shared/paciente"` |
| `from "../schemas/medicoSchema.js"` | `from "@clinica/shared/medico"` |

E, no corpo dos arquivos, `PacienteDTO` vira `PacienteInput`, `MedicoDTO` vira `MedicoInput`, e assim por diante.

> **Dica:** no VS Code, `Ctrl+Shift+H` (Substituir em arquivos) faz isso em segundos. Restrinja a busca à pasta `api/src`.

**Por que o import muda de `../schemas/x.js` para `@clinica/shared/x`:** antes era um caminho **relativo** para um arquivo da própria API. Agora é o **nome de um pacote**, resolvido pelo `exports` do `shared/package.json`. Repare que não tem `.js` no final: quem diz qual arquivo abrir é o mapa `"./*": "./src/*.ts"`.

Na `api/package.json`, adicione o shared como dependência:

```json
"@clinica/shared": "^1.0.0",
```

### 1.6 Instalando tudo

Na **raiz**:

```bash
npm install
cd api && npx prisma generate && cd ..
```

- O `npm install` da raiz instala as dependências dos três workspaces e cria o atalho do shared. Confira com `ls -l node_modules/@clinica`: deve aparecer `shared -> ../../shared`.
- O npm 12 **bloqueia scripts de instalação** por padrão e mostra um aviso `install-scripts` (entre eles, os do `prisma` e do `@prisma/engines`). Por isso geramos o Prisma Client à mão com `npx prisma generate`, que cria o client a partir do `schema.prisma`.

---

## 🛡️ PARTE 2: Backend

### 2.1 Senha no banco

Em `api/prisma/schema.prisma`, adicione a coluna `senha` no model `Secretario`:

```prisma
model Secretario {
  id           Int      @id @default(autoincrement())
  nome         String
  cpf          String   @unique
  telefone     String
  email        String?  @unique
  senha        String
  criadoEm     DateTime @default(now()) @map("criado_em")
  atualizadoEm DateTime @updatedAt @map("atualizado_em")

  @@map("secretarios")
}
```

Agora, em `api/`, rode:

```bash
npx prisma db push
```

**Vai dar erro, e é de propósito.** Mostre para a turma:

```text
Added the required column `senha` to the `secretarios` table without a default value.
There are 4 rows in this table, it is not possible to execute this step.
```

**Por quê:** a coluna é obrigatória (`String`, sem `?`), e o banco já tem secretários. Que senha eles teriam? O Prisma se recusa a inventar uma. Há três saídas:

| Saída | Quando usar |
| :--- | :--- |
| Apagar os secretários de teste | Banco de desenvolvimento, dados descartáveis (nosso caso) |
| `npx prisma db push --force-reset` | Recria o banco **inteiro**: perde pacientes, médicos e consultas também |
| Coluna opcional + pedir senha no próximo acesso | Sistema em produção, com usuários reais |

No nosso caso:

```bash
docker exec clinica-postgres psql -U postgres -d clinica -c "DELETE FROM secretarios;"
npx prisma db push
npx prisma generate
```

> **`db push` ou `migrate dev`?** Este banco foi criado sem histórico de migrações (não existe a tabela `_prisma_migrations`). O `db push` sincroniza o banco com o schema sem gerar arquivos de migração, e é o que usamos aqui. Migrações versionadas ficam para quando formos falar de deploy.

### 2.2 Guardando o hash da senha (bcryptjs)

Em `api/`:

```bash
npm install bcryptjs
```

> **Por que `bcryptjs` e não `bcrypt`?** O `bcrypt` é escrito em C++ e precisa de um script de instalação para compilar ou baixar o binário, justamente o tipo de script que o npm 12 bloqueia. O `bcryptjs` é JavaScript puro, gera hashes compatíveis e já vem com tipos TypeScript.

**Nunca guardamos senha em texto puro.** Se o banco vazar, o atacante leva as senhas, e as pessoas costumam reusar a mesma senha em outros sites. Guardamos um **hash**: uma transformação de mão única. Dá para conferir se uma senha bate com o hash, mas não dá para voltar do hash para a senha.

Em `api/src/services/secretarioService.ts`, o topo do arquivo fica assim:

```ts
import * as secretarioRepository from "../repositories/secretarioRepository.js";
import bcrypt from "bcryptjs";
import type { Secretario as SecretarioPrisma } from "@prisma/client";
import type {
  CadastroSecretarioInput,
  SecretarioInput,
} from "@clinica/shared/secretario";

// O omit global em config/prisma.ts tira a senha de todas as consultas
type Secretario = Omit<SecretarioPrisma, "senha">;

const SALT_ROUNDS = 10;
```

E a função de cadastro:

```ts
export async function criarSecretario(
  dados: CadastroSecretarioInput,
): Promise<Secretario> {
  // ... validações que já existiam (campos e CPF duplicado) ...

  // Nunca guardamos a senha em texto puro: o banco recebe só o hash
  const senhaHash = await bcrypt.hash(dados.senha, SALT_ROUNDS);
  return await secretarioRepository.create({ ...dados, senha: senhaHash });
}
```

- **`SALT_ROUNDS = 10`**: o custo do hash. Cada +1 **dobra** o tempo de cálculo. É lento de propósito: para quem cadastra, 10 rodadas são imperceptíveis, mas para quem tenta adivinhar milhões de senhas, viram um muro.
- **Salt:** o bcrypt mistura um valor aleatório em cada hash. Duas pessoas com a senha `12345678` ficam com hashes **diferentes** no banco.
- **`{ ...dados, senha: senhaHash }`**: copia todos os campos e substitui só a senha.

No repositório (`secretarioRepository.ts`), o `create` passa a receber `CadastroSecretarioInput`, porque agora os dados incluem a senha:

```ts
export async function create(data: CadastroSecretarioInput) {
  return await prisma.secretario.create({ data });
  //INSERT INTO secretarios (nome, cpf, telefone, email, senha) VALUES (?, ?, ?, ?, ?);
}
```

O controller também troca o tipo do `cadastrar` para `CadastroSecretarioInput`, e a rota de POST valida com o schema de cadastro:

```ts
router.post("/secretarios", validarBody(cadastroSecretarioSchema), controller.cadastrar);
router.put("/secretarios/:id", validarBody(secretarioSchema), controller.atualizar);
```

### 2.3 Nunca devolver o hash: `omit` global do Prisma

Mesmo com hash, a senha **não deve sair da API**. Em vez de lembrar de esconder em cada consulta, configuramos o Prisma uma vez, em `api/src/config/prisma.ts`:

```ts
// omit global: nenhuma consulta devolve o hash da senha, a não ser que peça explicitamente
export const prisma = new PrismaClient({
  adapter,
  omit: { secretario: { senha: true } },
});
```

Agora `findMany`, `findUnique`, `create` e `update` de secretário devolvem tudo **menos** `senha`. Por isso o service usa `Omit<SecretarioPrisma, "senha">` como tipo de retorno: o TypeScript sabe que o campo não vem. Na aula de login vamos precisar ler o hash para comparar, e aí usaremos `omit: { senha: false }` só naquela consulta.

### 2.4 Swagger: o body do cadastro com senha

Em `api/src/config/swagger.ts`, troque os imports dos schemas:

```ts
import { pacienteSchema } from "@clinica/shared/paciente";
import { medicoSchema } from "@clinica/shared/medico";
import {
  cadastroSecretarioSchema,
  secretarioSchema,
} from "@clinica/shared/secretario";
import { consultaSchema, consultaFiltroSchema } from "@clinica/shared/consulta";
```

O helper `registrarCrud` usava **o mesmo schema** para o body do POST e para o modelo devolvido. No secretário, esses dois agora são diferentes: o POST tem senha e a resposta não tem. Acrescente um parâmetro opcional `schemaCadastro`:

```ts
function registrarCrud({
  tag,
  path,
  nomeModelo,
  schema,
  schemaCadastro = schema,
  queryFiltros,
}: {
  tag: string;
  path: string;
  nomeModelo: string;
  schema: ZodType;
  // Body do POST quando ele difere do modelo (ex.: secretário tem senha só no cadastro)
  schemaCadastro?: ZodType;
  queryFiltros?: ZodObject<any>;
}) {
```

`schemaCadastro = schema` é um **valor padrão**: quem não passar nada continua como antes. No `registerPath` do POST, troque `jsonBody(schema)` por `jsonBody(schemaCadastro)`.

Por fim, no registro dos secretários, passe o schema de cadastro:

```ts
registrarCrud({
  tag: "Secretários",
  path: "/secretarios",
  nomeModelo: "Secretario",
  schema: secretarioSchema,
  schemaCadastro: cadastroSecretarioSchema,
});
```

Os registros de pacientes, médicos e consultas não mudam.

### 2.5 CORS: deixando o front conversar com a API

Em `api/`:

```bash
npm install cors
npm install -D @types/cors
```

Em `api/src/server.ts`:

```ts
import cors from "cors";
// ...
const app = express();

// Libera o front (outra origem: porta 5173) para chamar a API pelo navegador
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json());
```

**O que é CORS:** o navegador considera `http://localhost:5173` (o front) e `http://localhost:3000` (a API) **origens diferentes**, porque a porta é diferente. Por segurança, ele só entrega a resposta de outra origem ao JavaScript da página se a API disser "essa origem pode". É isso que o cabeçalho `Access-Control-Allow-Origin` faz.

- O `curl` e o Swagger **não** passam por essa regra: ela é do navegador. Por isso a API "funciona no Swagger e não no front".
- `cors()` sem opções libera **qualquer** site. Passando a `origin`, liberamos só o nosso front.
- O `app.use(cors(...))` precisa vir **antes** das rotas. Antes de um `POST` com JSON, o navegador manda uma requisição `OPTIONS` (o *preflight*) perguntando se pode, e o `cors` responde a ela.

### 2.6 Testando a API com `curl`

Em `api/`, rode `npm run dev` e, em outro terminal:

```bash
# Cadastro válido → 201, a resposta NÃO tem "senha" e o email vem null
curl -s -X POST localhost:3000/secretarios -H 'Content-Type: application/json' \
  -d '{"nome":"Ana Lima","cpf":"12345678901","telefone":"79999998888","senha":"senhaForte123"}'

# Mesmo CPF de novo → 400 "Já existe um secretário cadastrado com este CPF."
# (repita o comando acima)

# Dados inválidos → 400 com a lista de erros por campo
curl -s -X POST localhost:3000/secretarios -H 'Content-Type: application/json' \
  -d '{"nome":"A","cpf":"123","telefone":"7","email":"x","senha":"123"}'

# O que ficou gravado no banco: começa com $2b$10$ e tem 60 caracteres
docker exec clinica-postgres psql -U postgres -d clinica -c "SELECT cpf, senha FROM secretarios;"

# CORS: a resposta deve trazer Access-Control-Allow-Origin: http://localhost:5173
curl -s -i -X OPTIONS localhost:3000/secretarios \
  -H 'Origin: http://localhost:5173' -H 'Access-Control-Request-Method: POST' | grep -i allow-origin
```

Abra `http://localhost:3000/docs`. No `POST /secretarios` o body tem `senha`, e no modelo `Secretario` ela não aparece.

---

## 🎨 PARTE 3: Frontend com React + Mantine

### 3.1 Criando o projeto com Vite

Na **raiz**:

```bash
npm create vite@latest frontend -- --template react-ts --no-interactive
```

- `--template react-ts`: React com TypeScript.
- `--no-interactive`: sem isso, o create-vite pergunta qual linter usar e se deve instalar e rodar o projeto. Como o `frontend/` já está listado nos workspaces, a instalação vai ser feita da raiz.

**Limpando o que não vamos usar:**

```bash
rm -r frontend/src/App.css frontend/src/index.css frontend/src/assets frontend/README.md
```

O CSS do template disputaria com o do Mantine, e as imagens são do exemplo do Vite.

Em `frontend/index.html`, troque `<html lang="en">` por `<html lang="pt-BR">` e o `<title>` por `Clínica Médica`. O `lang` informa o idioma ao navegador e aos leitores de tela, e corrige o corretor ortográfico dos campos.

### 3.2 Instalando as dependências

Na **raiz**, usando `-w frontend` para instalar no workspace certo:

```bash
npm install -w frontend @mantine/core @mantine/hooks @mantine/form axios zod @clinica/shared
npm install -w frontend -D postcss postcss-preset-mantine postcss-simple-vars
```

| Pacote | Para que serve |
| :--- | :--- |
| `@mantine/core` | Os componentes: `TextInput`, `Button`, `Paper`, `Alert`... |
| `@mantine/hooks` | Hooks utilitários. O `@mantine/core` depende dele |
| `@mantine/form` | O hook `useForm`: valores, erros e envio do formulário |
| `axios` | Cliente HTTP para chamar a API |
| `zod` | Usado para estender o schema com a confirmação de senha |
| `@clinica/shared` | Nossos schemas, os mesmos da API |
| `postcss-preset-mantine` + `postcss-simple-vars` | Plugins de CSS que o Mantine usa para funções e breakpoints |

Crie `frontend/postcss.config.cjs`:

```js
module.exports = {
  plugins: {
    "postcss-preset-mantine": {},
    "postcss-simple-vars": {
      variables: {
        "mantine-breakpoint-xs": "36em",
        "mantine-breakpoint-sm": "48em",
        "mantine-breakpoint-md": "62em",
        "mantine-breakpoint-lg": "75em",
        "mantine-breakpoint-xl": "88em",
      },
    },
  },
};
```

O Vite lê esse arquivo sozinho. Sem ele, o CSS dos componentes funciona, mas os nossos arquivos `.module.css` não conseguem usar as funções do Mantine (`rem()`, `light-dark()`) nem as variáveis de breakpoint. Configuramos agora para não tropeçar nisso depois.

### 3.3 Ligando o Mantine: `frontend/src/main.tsx`

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider>
      <App />
    </MantineProvider>
  </StrictMode>,
);
```

- **`import "@mantine/core/styles.css"`**: o CSS de todos os componentes. Sem ele, os componentes renderizam "pelados".
- **`<MantineProvider>`**: um *Context* do React (lembram do tutorial?) que entrega o tema (cores, fontes, espaçamentos) a todos os componentes abaixo dele. Sem o provider, os componentes do Mantine dão erro.
- **`StrictMode`**: em desenvolvimento, o React monta os componentes duas vezes para expor efeitos mal escritos. Em produção isso não acontece.

### 3.4 O cliente HTTP: `frontend/src/services/api.ts`

```ts
import axios from "axios";

// Instância única do axios: a URL base fica num lugar só
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

// Formato dos erros que a API devolve (middleware validarBody e handler global)
export interface ErroApi {
  mensagem: string;
  detalhes?: { campo: string; mensagem: string }[];
}
```

**Por que axios e não `fetch`?** O `fetch` é nativo e funciona, mas para conversar com a nossa API o axios evita três tropeços comuns:

| | `fetch` | `axios` |
| :--- | :--- | :--- |
| Resposta 400/500 | **Não** dá erro; você precisa checar `res.ok` | Lança erro, e o `catch` pega |
| Enviar JSON | `JSON.stringify` + cabeçalho `Content-Type` à mão | Automático |
| Ler JSON | `await res.json()` | Já vem em `resposta.data` |
| URL base e token em todas as chamadas | Cada chamada repete | `axios.create` + interceptor (próxima aula) |

- **`import.meta.env.VITE_API_URL`**: é assim que o Vite expõe variáveis de ambiente para o front. Só as que começam com `VITE_` são expostas, para nenhum segredo do servidor vazar para o navegador por engano.
- **`ErroApi`**: descreve os dois formatos de erro que a API devolve. O `validarBody` manda `mensagem` + `detalhes` por campo, e o handler global (CPF duplicado, por exemplo) manda só `mensagem`.

Crie também `frontend/.env.example`, documentando a variável para quem clonar o projeto:

```env
VITE_API_URL=http://localhost:3000
```

### 3.5 O serviço do secretário: `frontend/src/services/secretarioService.ts`

```ts
import type {
  CadastroSecretarioInput,
  Secretario,
} from "@clinica/shared/secretario";
import { api } from "./api.ts";

export async function cadastrarSecretario(
  dados: CadastroSecretarioInput,
): Promise<Secretario> {
  const resposta = await api.post<Secretario>("/secretarios", dados);
  return resposta.data;
}
```

**Aqui o shared aparece no front pela primeira vez.** `CadastroSecretarioInput` e `Secretario` são **os mesmos tipos** que a API usa. Se amanhã alguém adicionar um campo obrigatório no schema, o TypeScript acusa erro aqui antes de qualquer teste.

O `post<Secretario>` informa ao axios o tipo da resposta, e `resposta.data` já chega tipado.

### 3.6 A página de cadastro: `frontend/src/pages/CadastroSecretarioPage.tsx`

```tsx
import { useState } from "react";
import {
  Alert,
  Button,
  Paper,
  PasswordInput,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";
import axios from "axios";
import { z } from "zod";
import { cadastroSecretarioSchema } from "@clinica/shared/secretario";
import type { ErroApi } from "../services/api.ts";
import { cadastrarSecretario } from "../services/secretarioService.ts";

// Mesmo schema da API + a confirmação de senha, que só existe na tela
const formularioSchema = cadastroSecretarioSchema
  .extend({ confirmarSenha: z.string() })
  .refine((dados) => dados.senha === dados.confirmarSenha, {
    message: "As senhas não conferem",
    path: ["confirmarSenha"],
  });

type FormularioValores = {
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  senha: string;
  confirmarSenha: string;
};

export function CadastroSecretarioPage() {
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const form = useForm<FormularioValores>({
    mode: "uncontrolled",
    initialValues: {
      nome: "",
      cpf: "",
      telefone: "",
      email: "",
      senha: "",
      confirmarSenha: "",
    },
    validate: schemaResolver(formularioSchema, { sync: true }),
  });

  async function cadastrar(valores: FormularioValores) {
    setSucesso(null);
    setErro(null);

    // confirmarSenha não vai para a API
    const { confirmarSenha: _, ...dados } = valores;

    try {
      const secretario = await cadastrarSecretario(dados);
      setSucesso(`${secretario.nome} foi cadastrado(a) com sucesso!`);
      form.reset();
    } catch (e) {
      if (axios.isAxiosError<ErroApi>(e) && e.response) {
        const { mensagem, detalhes } = e.response.data;
        if (detalhes) {
          form.setErrors(
            Object.fromEntries(detalhes.map((d) => [d.campo, d.mensagem])),
          );
        }
        setErro(mensagem);
      } else {
        setErro("Não foi possível conectar à API. Ela está rodando?");
      }
    }
  }

  return (
    <Paper withBorder shadow="sm" p="lg" radius="md">
      <Title order={2} mb="md">
        Cadastro de secretário
      </Title>

      <form onSubmit={form.onSubmit(cadastrar)}>
        <Stack>
          {sucesso && <Alert color="green">{sucesso}</Alert>}
          {erro && <Alert color="red">{erro}</Alert>}

          <TextInput
            label="Nome"
            withAsterisk
            key={form.key("nome")}
            {...form.getInputProps("nome")}
          />
          {/* ... CPF, Telefone e E-mail seguem o mesmo padrão ... */}
          <PasswordInput
            label="Senha"
            description="Pelo menos 8 caracteres"
            withAsterisk
            key={form.key("senha")}
            {...form.getInputProps("senha")}
          />
          <PasswordInput
            label="Confirmar senha"
            withAsterisk
            key={form.key("confirmarSenha")}
            {...form.getInputProps("confirmarSenha")}
          />

          <Button type="submit" loading={form.submitting}>
            Cadastrar
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}
```

> O arquivo completo no repositório tem os seis campos. CPF, Telefone e E-mail são `TextInput` iguais ao de Nome; o CPF tem `description="Somente os 11 números"` e o E-mail não tem `withAsterisk`, porque é opcional.

Vamos por partes.

#### O schema do formulário

```ts
const formularioSchema = cadastroSecretarioSchema
  .extend({ confirmarSenha: z.string() })
  .refine((dados) => dados.senha === dados.confirmarSenha, { ... });
```

- Partimos do **mesmo** `cadastroSecretarioSchema` da API: nome, CPF, telefone, e-mail e senha são validados **com as mesmas regras e as mesmas mensagens** dos dois lados.
- `confirmarSenha` é coisa **só da tela**. A API não precisa disso, então o campo não vai para o shared.
- `.refine()` é uma validação que olha **o objeto inteiro**: aqui, compara dois campos. O `path: ["confirmarSenha"]` diz embaixo de qual campo a mensagem aparece. Ela aparece junto com os erros dos outros campos, então o usuário vê tudo de uma vez.

#### `useForm`

- **`mode: "uncontrolled"`**: o Mantine guarda os valores **fora do estado do React** e não re-renderiza a página a cada tecla.
- **`initialValues`**: o valor inicial de cada campo. Também é para esses valores que o formulário volta no `form.reset()`.
- **`validate: schemaResolver(formularioSchema, { sync: true })`**: o `schemaResolver` aceita qualquer biblioteca que siga o padrão **Standard Schema**, e o Zod 4 segue. Por isso não precisamos de pacote adaptador. O `{ sync: true }` pede validação síncrona: nosso schema não tem nenhuma regra assíncrona (como "consultar a API para ver se o CPF existe").

#### Ligando cada campo: `key` + `getInputProps`

```tsx
<TextInput key={form.key("nome")} {...form.getInputProps("nome")} />
```

- `form.getInputProps("nome")` devolve um objeto com `defaultValue`, `onChange`, `error`... e o `{...}` espalha tudo como props do `TextInput`. Uma linha conecta valor, mudança e mensagem de erro.
- `key={form.key("nome")}`: no modo *uncontrolled*, o campo não é controlado pelo estado do React, então o Mantine usa essa `key` para recriar o campo quando o valor muda por fora (por exemplo, no `reset`). Lembram do tutorial: quando a `key` muda, o React recria o componente.

#### O envio: `form.onSubmit(cadastrar)`

1. O usuário clica em **Cadastrar**.
2. `form.onSubmit` chama `preventDefault()` (o navegador **não** recarrega a página), roda a validação e só chama `cadastrar(valores)` se **tudo** passou. Se algo falhar, os erros aparecem embaixo dos campos e **nenhuma requisição é feita**.
3. Em `cadastrar`, `const { confirmarSenha: _, ...dados } = valores;` separa a confirmação do resto. O `...dados` junta os outros campos, e o `_` é a convenção para "variável que não vou usar".
4. Enquanto a `Promise` de `cadastrar` não termina, `form.submitting` fica `true` e o botão mostra um spinner (`loading`), o que evita clique duplo.

#### Tratando os erros da API

O front já valida tudo, então por que tratar erro de validação da API?

- **CPF duplicado:** só o banco sabe disso. A API responde **400** `{ mensagem: "Já existe um secretário cadastrado com este CPF." }`, e mostramos isso no `Alert` vermelho.
- **Defesa em profundidade:** qualquer um pode chamar a API sem passar pelo front (pelo `curl`, por exemplo). Se as regras divergirem um dia, os `detalhes` voltam campo a campo e o `form.setErrors` coloca cada mensagem **embaixo do campo certo**.
- **API fora do ar:** o `axios.isAxiosError(e) && e.response` é falso quando nem houve resposta, e mostramos "Não foi possível conectar à API".

#### E o TanStack Query?

Nesta tela não precisamos dele. O TanStack Query brilha para **buscar e manter dados** na tela: listas que precisam de cache, recarregar ou ficar sincronizadas. Um cadastro é **uma ação disparada por um clique**: chama a API uma vez e mostra o resultado. O `useForm` com o `form.submitting` já cobre o "carregando". Quando chegarmos nas listagens, comparamos o `useEffect` manual com uma biblioteca e decidimos com a turma.

### 3.7 `frontend/src/App.tsx`

```tsx
import { Container } from "@mantine/core";
import { CadastroSecretarioPage } from "./pages/CadastroSecretarioPage.tsx";

export default function App() {
  return (
    <Container size="xs" py="xl">
      <CadastroSecretarioPage />
    </Container>
  );
}
```

O `Container size="xs"` centraliza a página e limita a largura, o que basta para um formulário. Navegação, menu lateral e rotas entram quando houver mais de uma tela (próximas aulas, com o login).

---

## 🧪 PARTE 4: Testando em sala

Dois terminais, ambos na **raiz**:

```bash
npm run dev -w api        # API em http://localhost:3000
npm run dev -w frontend   # Front em http://localhost:5173
```

Abra `http://localhost:5173` com o DevTools aberto (F12, aba **Rede/Network**) e passe pelos cenários:

| # | O que fazer | O que deve acontecer |
| :--- | :--- | :--- |
| 1 | Clicar **Cadastrar** com tudo vazio | Mensagens embaixo dos campos e **nenhuma** requisição na aba Rede: o Zod barrou no navegador |
| 2 | CPF `123`, e-mail `bruno`, senha `abc` e confirmação `xyz` | Uma mensagem por campo, incluindo "As senhas não conferem" |
| 3 | Dados válidos, e-mail **vazio** | Alerta verde, formulário limpo e `POST` **201** na aba Rede |
| 4 | Repetir o cadastro do cenário 3 | Alerta vermelho "Já existe um secretário cadastrado com este CPF." e `POST` **400** |
| 5 | Derrubar a API (Ctrl+C) e cadastrar | Alerta "Não foi possível conectar à API. Ela está rodando?" |
| 6 | No banco: `SELECT cpf, senha FROM secretarios;` | Hash começando com `$2b$10$`, nunca a senha digitada |

**Pergunta para a turma:** no cenário 1, quem validou? E se alguém mudar a regra do CPF no `shared/src/secretario.ts`, onde a mudança aparece? (Nos dois lados ao mesmo tempo. Façam o teste.)

---

## 📝 Exercícios

1. **Máscara de CPF:** aceite `123.456.789-01` no formulário, removendo tudo que não é dígito com `z.preprocess`, no mesmo estilo do e-mail. A mudança é só no shared: a API passa a aceitar também, sem tocar nela.
2. **Mostrar/ocultar senha:** o `PasswordInput` já tem o botão do olho. Descubra na documentação do Mantine como deixar os dois campos de senha alternando juntos (dica: `visible` e `onVisibilityChange`, com `useDisclosure` do `@mantine/hooks`).
3. **E-mail único:** o e-mail tem `@unique` no banco. Cadastre dois secretários com o mesmo e-mail. Qual erro aparece? Trate isso no service, como já é feito com o CPF.
4. **Tela de cadastro de médico:** monte `CadastroMedicoPage` usando o `medicoSchema` do shared. Quantas regras de validação você precisou escrever no front?

---

## 🔜 Próxima aula: Login

- `POST /auth/login` na API: buscar o secretário pelo **CPF** (com `omit: { senha: false }`), comparar com `bcrypt.compare` e devolver um **JWT**.
- No front: tela de login, guardar o token e enviá-lo em toda requisição com um **interceptor** do axios.
- Proteger as rotas da API com um middleware que valida o token.

---

## 📋 Resumo

| Antes | Depois |
| :--- | :--- |
| Backend na raiz | `api/`, `frontend/` e `shared/` como **npm workspaces** |
| Schemas em `api/src/schemas` + interfaces repetidas em `api/src/types` | Schemas em `shared/`, tipos via `z.infer`, **uma fonte da verdade** |
| `.openapi()` (amarrado ao backend) | `.meta()` (Zod puro, serve às duas pontas) |
| Secretário sem senha | Senha guardada como **hash bcrypt**, nunca devolvida (`omit` global) |
| — | CORS liberado só para o front |
| — | Tela de cadastro com Mantine, validando com o **mesmo schema** da API |
