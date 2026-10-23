# 📘 Roteiro de Aula: Frontend com React + Mantine — Cadastro e Login do Secretário

> **Objetivo da Aula:**
> Criar o frontend da Clínica Médica **do zero**, com React + Vite + Mantine, e construir as duas primeiras telas: **cadastro** e **login** do secretário, conversando com a API de verdade.

---

## 🔄 O que mudou no backend (PR #5)

Comece a aula por aqui: uns 15 minutos mostrando o que o PR #5 trouxe para a API. A turma não vai escrever esse código, mas vai **usar** tudo isso no front. Abra cada arquivo junto com eles.

O front vai usar estas duas rotas (a de cadastro já existia, agora com senha; a de login é nova):

| Rota | O que faz |
| :--- | :--- |
| `POST /secretarios` | Cadastra um secretário com `nome`, `cpf`, `telefone`, `email` (opcional) e `senha` |
| `POST /auth/login` | Recebe `cpf` e `senha`. Devolve o secretário (**200**) ou `{ mensagem: "CPF ou senha inválidos" }` (**401**) |

### 1. Workspaces: `api/` + `shared/` (+ `frontend/` hoje)

O backend saiu da raiz e foi para `api/`. O `package.json` da raiz agora só declara os pacotes do repositório:

```json
{
  "name": "clinica-medica",
  "private": true,
  "workspaces": ["shared", "api", "frontend"]
}
```

- **Workspaces** são um recurso do próprio npm para vários pacotes num repositório só. Um `npm install` na raiz instala tudo num único `node_modules`, e cada workspace vira um "pacote local" que os outros podem importar.
- O `frontend` já está na lista, mas a pasta ainda não existe: é ela que vamos criar hoje.
- Os comandos passam a usar `-w`: `npm run dev -w api` roda o `dev` do pacote `api` sem entrar na pasta.

### 2. O pacote `shared/`: as regras num lugar só

Os schemas Zod saíram de `api/src/schemas/` e foram para `shared/src/`, com o nome de pacote `@clinica/shared`:

```text
shared/src/
├── paciente.ts     → pacienteSchema
├── medico.ts       → medicoSchema
├── secretario.ts   → secretarioSchema, cadastroSecretarioSchema, tipo Secretario
├── consulta.ts     → consultaSchema, consultaFiltroSchema
└── auth.ts         → loginSchema
```

A API importa assim, e o front vai importar **igualzinho**:

```ts
import { cadastroSecretarioSchema } from "@clinica/shared/secretario";
```

Duas mudanças que a turma vai notar ao abrir os arquivos:

- **`.openapi(...)` virou `.meta(...)`.** O `.openapi()` vinha de uma biblioteca de Swagger, que é coisa do backend. O `.meta()` é do **próprio Zod**, e o Swagger continua lendo os exemplos dele. Assim, o front pode importar os schemas sem levar biblioteca de backend junto.
- **As interfaces `PacienteDTO`, `MedicoDTO`... sumiram.** Os tipos agora saem dos schemas com `z.infer`, então não existe mais uma interface repetindo os campos à mão:

  ```ts
  export type CadastroSecretarioInput = z.infer<typeof cadastroSecretarioSchema>;
  ```

### 3. O secretário agora tem senha

Abra `shared/src/secretario.ts`:

```ts
// Cadastro = dados do secretário + senha. A senha fica fora do secretarioSchema
// para nunca aparecer na resposta da API nem no PUT de atualização.
export const cadastroSecretarioSchema = secretarioSchema.extend({
  senha: z
    .string({ error: "A senha é obrigatória" })
    .min(8, "A senha deve ter pelo menos 8 caracteres")
    .max(72, "A senha deve ter no máximo 72 caracteres")
    .meta({ example: "senhaForte123" }),
});
```

- **Dois schemas.** `secretarioSchema` tem os dados (nome, CPF, telefone, e-mail), e `cadastroSecretarioSchema` tem os dados **+ senha**. O `POST /secretarios` exige senha, e o `PUT` não mexe nela.
- **E-mail vazio vira `null`.** No formulário, um campo de e-mail em branco é a string `""`. O schema converte `""` em `null` antes de validar, então o campo opcional funciona do jeito esperado na tela.
- **No banco, a senha é opcional** (`senha String?` no `schema.prisma`). Assim, o `prisma db push` funcionou sem apagar os secretários antigos, que ficam sem senha e não conseguem logar.
- **A senha nunca é guardada como foi digitada.** O service guarda um **hash** bcrypt:

  ```ts
  const senhaHash = await bcrypt.hash(dados.senha, SALT_ROUNDS);
  ```

  Um hash é uma transformação de mão única: dá para conferir se uma senha bate com ele, mas não dá para voltar do hash para a senha. Mostre no banco: `SELECT cpf, senha FROM secretarios;` exibe algo como `$2b$10$...`.
- **A senha nunca sai da API.** O Prisma foi configurado (em `api/src/config/prisma.ts`) para **omitir** o campo `senha` em todas as consultas. Para o front, isso significa que o objeto `Secretario` que chega nunca tem senha.

### 4. A rota de login: `POST /auth/login`

O schema, em `shared/src/auth.ts`:

```ts
export const loginSchema = z.object({
  cpf: z
    .string({ error: "O CPF é obrigatório" })
    .regex(/^\d{11}$/, "O CPF deve conter exatamente 11 números (apenas dígitos)"),
  senha: z
    .string({ error: "A senha é obrigatória" })
    .min(1, "A senha é obrigatória"),
});
```

(No arquivo, cada campo também tem um `.meta({ example })` para o Swagger.)

A lógica, em `api/src/services/authService.ts`:

```ts
export async function autenticar({ cpf, senha }: LoginInput) {
  const secretario = await secretarioRepository.findByCpfComSenha(cpf);
  if (!secretario || !secretario.senha) {
    return null;
  }

  const senhaConfere = await bcrypt.compare(senha, secretario.senha);
  if (!senhaConfere) {
    return null;
  }

  const { senha: _, ...secretarioSemSenha } = secretario;
  return secretarioSemSenha;
}
```

- `findByCpfComSenha` é a **única** consulta que traz o hash, porque precisa dele para comparar.
- `bcrypt.compare` aplica o hash na senha digitada e compara com o hash guardado.
- O controller responde **200** com o secretário (sem senha) ou **401** com `{ "mensagem": "CPF ou senha inválidos" }`.
- **Não há token.** A API confere a senha e responde, e pronto: ela não "lembra" de quem logou. Quem vai lembrar é o front, num `useState` (Parte 6).

### 5. CORS

Em `api/src/server.ts`:

```ts
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
```

- O front roda em `http://localhost:5173` e a API, em `http://localhost:3000`. Como a porta é diferente, o navegador considera que são **origens diferentes**. Por segurança, ele só entrega ao JavaScript da página a resposta de outra origem se a API autorizar com o cabeçalho `Access-Control-Allow-Origin`.
- Sem essa linha, o front receberia erro de CORS no console, mesmo com a API funcionando no Swagger e no `curl`. Essa regra vale **só no navegador**.

### Resumo para o front

| O front vai usar... | Que veio de... |
| :--- | :--- |
| `cadastroSecretarioSchema` e `loginSchema` para validar os formulários | `shared/src/secretario.ts` e `shared/src/auth.ts` |
| Os tipos `CadastroSecretarioInput`, `LoginInput` e `Secretario` | `z.infer` nos mesmos arquivos |
| `POST /secretarios` (201 ou 400) | Cadastro com senha + hash |
| `POST /auth/login` (200 ou 401) | Nova rota de autenticação |
| Chamar a API do navegador sem erro | CORS |

---

## 🎯 Ponto de partida

A turma fez o tutorial do react.dev, então já viu componentes, props, `useState`, renderização condicional e "subir o estado" (o tutorial do jogo da velha). Agora vamos aplicar tudo isso num projeto real, usando o que o PR #5 preparou no backend.

---

## 🧰 PASSO 0: Preparando o ambiente

Depois de atualizar a `main` (`git pull`), na **raiz** do projeto:

```bash
mv .env api/          # só se o .env ainda estiver na raiz
rm -rf node_modules   # o node_modules antigo era só da API
npm install
cd api
npx prisma generate
npx prisma db push
cd ..
npm run dev -w api
```

- O `npm install` **na raiz** instala as dependências de todos os workspaces num único `node_modules`.
- O `npx prisma db push` cria a coluna `senha` no banco. Ela é opcional, então os secretários antigos continuam lá, só que sem senha (e sem login).
- `npm run dev -w api`: o `-w` (workspace) roda o script `dev` **do pacote `api`** sem precisar entrar na pasta.

Abra `http://localhost:3000/docs` e confira a tag **Autenticação**.

---

## 🏗️ PARTE 1: Criando o projeto com Vite

Em outro terminal, também na **raiz**:

```bash
npm create vite@latest frontend -- --template react-ts --no-interactive
npm install
```

- `--template react-ts`: React com TypeScript.
- `--no-interactive`: sem isso, o create-vite pergunta qual linter usar e se deve instalar e rodar. Vamos instalar pela raiz.
- **O `npm install` logo depois é obrigatório.** O `frontend/` já estava listado nos workspaces do `package.json` da raiz, mas só agora a pasta existe. Esse `npm install` registra o novo workspace. Se pular direto para o `npm install -w frontend <pacote>` do próximo passo, o npm instala o pacote mas **não grava** em `frontend/package.json`. Testamos: a dependência some do `package.json`.

**Limpando o que não vamos usar:**

```bash
rm -r frontend/src/App.css frontend/src/index.css frontend/src/assets frontend/README.md
```

O CSS do template disputaria com o do Mantine, e as imagens são do exemplo do Vite.

Em `frontend/index.html`, troque `<html lang="en">` por `<html lang="pt-BR">` e o `<title>` por `Clínica Médica`. O `lang` informa o idioma ao navegador e aos leitores de tela, e corrige o corretor ortográfico dos campos.

---

## 🎨 PARTE 2: Instalando e ligando o Mantine

### 2.1 Dependências

Na **raiz**:

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
| `zod` | Para estender um schema do shared (a confirmação de senha) |
| `@clinica/shared` | Os schemas e tipos do projeto, os mesmos da API |
| `postcss-preset-mantine` + `postcss-simple-vars` | Plugins de CSS que o Mantine usa para funções e breakpoints |

Confira: `frontend/package.json` agora lista esses pacotes, e `ls -l node_modules/@clinica` mostra `shared -> ../../shared`. Esse atalho é o que faz `import ... from "@clinica/shared/..."` funcionar: o shared não é baixado do npm, é a pasta do próprio repositório.

### 2.2 PostCSS

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

O Vite lê esse arquivo sozinho. Hoje usamos só os componentes prontos, mas, quando escrevermos nossos próprios `.module.css`, os plugins liberam as funções do Mantine (`rem()`, `light-dark()`) e as variáveis de breakpoint.

### 2.3 `frontend/src/main.tsx`

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
- **`<MantineProvider>`**: um *Context* do React que entrega o tema (cores, fontes, espaçamentos) a todos os componentes abaixo dele. Os componentes do Mantine não funcionam fora dele.
- **`StrictMode`**: em desenvolvimento, o React executa algumas coisas duas vezes para expor efeitos mal escritos. Em produção, não.

---

## 🔌 PARTE 3: Falando com a API

### 3.1 O cliente HTTP: `frontend/src/services/api.ts`

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
| Resposta 400/401/500 | **Não** dá erro; você precisa checar `res.ok` | Lança erro, e o `catch` pega |
| Enviar JSON | `JSON.stringify` + cabeçalho `Content-Type` à mão | Automático |
| Ler JSON | `await res.json()` | Já vem em `resposta.data` |

- **`axios.create({ baseURL })`**: daqui pra frente, `api.post("/auth/login", ...)` já sabe o endereço da API.
- **`import.meta.env.VITE_API_URL`**: é assim que o Vite expõe variáveis de ambiente para o front. Só as que começam com `VITE_` chegam ao navegador, para nenhum segredo vazar por engano.
- **`ErroApi`**: descreve os formatos de erro da nossa API. Os erros de validação trazem `mensagem` + `detalhes` (um por campo), e os outros (CPF duplicado, login inválido) trazem só `mensagem`.

Crie também `frontend/.env.example`, documentando a variável para quem clonar o projeto:

```env
VITE_API_URL=http://localhost:3000
```

### 3.2 Os serviços

`frontend/src/services/secretarioService.ts`:

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

`frontend/src/services/authService.ts`:

```ts
import type { LoginInput } from "@clinica/shared/auth";
import type { Secretario } from "@clinica/shared/secretario";
import { api } from "./api.ts";

export async function login(dados: LoginInput): Promise<Secretario> {
  const resposta = await api.post<Secretario>("/auth/login", dados);
  return resposta.data;
}
```

- **Os tipos vêm do shared.** `CadastroSecretarioInput`, `LoginInput` e `Secretario` são **os mesmos** que a API usa. Se alguém adicionar um campo obrigatório no schema, o TypeScript acusa erro aqui antes de qualquer teste.
- **`post<Secretario>`** informa o tipo da resposta, e `resposta.data` já chega tipado.
- **Por que separar em `services/`?** As telas não precisam saber URL nem método HTTP: chamam `login(dados)` e pronto. Se a rota mudar, muda num lugar só.

---

## 📝 PARTE 4: A tela de cadastro

Crie `frontend/src/pages/CadastroSecretarioPage.tsx`:

```tsx
import { useState } from "react";
import {
  Alert,
  Anchor,
  Button,
  Paper,
  PasswordInput,
  SimpleGrid,
  Stack,
  Text,
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

type CadastroSecretarioPageProps = {
  onIrParaLogin: () => void;
};

export function CadastroSecretarioPage({
  onIrParaLogin,
}: CadastroSecretarioPageProps) {
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
    <Paper withBorder shadow="md" p="xl" radius="md" w="100%" maw={560}>
      <Text c="blue" fw={700} size="sm">
        Clínica Médica
      </Text>
      <Title order={2}>Cadastro de secretário</Title>
      <Text c="dimmed" size="sm" mb="lg">
        Preencha seus dados para criar o acesso
      </Text>

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
          {/* 1 coluna no celular, 2 a partir de telas "sm" (48em) */}
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput
              label="CPF"
              placeholder="Somente números"
              withAsterisk
              key={form.key("cpf")}
              {...form.getInputProps("cpf")}
            />
            <TextInput
              label="Telefone"
              placeholder="DDD + número"
              withAsterisk
              key={form.key("telefone")}
              {...form.getInputProps("telefone")}
            />
          </SimpleGrid>
          <TextInput
            label="E-mail"
            placeholder="nome@clinica.com (opcional)"
            key={form.key("email")}
            {...form.getInputProps("email")}
          />
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <PasswordInput
              label="Senha"
              placeholder="Mínimo 8 caracteres"
              withAsterisk
              key={form.key("senha")}
              {...form.getInputProps("senha")}
            />
            <PasswordInput
              label="Confirmar senha"
              placeholder="Repita a senha"
              withAsterisk
              key={form.key("confirmarSenha")}
              {...form.getInputProps("confirmarSenha")}
            />
          </SimpleGrid>

          <Button type="submit" loading={form.submitting}>
            Cadastrar
          </Button>

          <Text size="sm" ta="center">
            Já tem conta?{" "}
            <Anchor component="button" type="button" onClick={onIrParaLogin}>
              Entrar
            </Anchor>
          </Text>
        </Stack>
      </form>
    </Paper>
  );
}
```

Vamos por partes.

### 4.1 O schema do formulário

```ts
const formularioSchema = cadastroSecretarioSchema
  .extend({ confirmarSenha: z.string() })
  .refine((dados) => dados.senha === dados.confirmarSenha, { ... });
```

- Partimos do **mesmo** `cadastroSecretarioSchema` que a API usa no `POST /secretarios`: nome, CPF, telefone, e-mail e senha são validados **com as mesmas regras e as mesmas mensagens**.
- `confirmarSenha` é coisa **só da tela**: a API não recebe esse campo. Por isso o adicionamos aqui com `.extend()`, e não no shared.
- `.refine()` é uma validação que olha **o objeto inteiro**: aqui, compara dois campos. O `path: ["confirmarSenha"]` diz embaixo de qual campo a mensagem aparece. Ela aparece junto com os erros dos outros campos, então o usuário vê tudo de uma vez.

> Abra `shared/src/secretario.ts` e mostre para a turma de onde vêm as mensagens que vão aparecer na tela.

### 4.2 `useForm`

- **`mode: "uncontrolled"`**: o Mantine guarda os valores **fora do estado do React** e não re-renderiza o componente a cada tecla.
- **`initialValues`**: o valor inicial de cada campo. Também é para esses valores que o formulário volta no `form.reset()`.
- **`validate: schemaResolver(formularioSchema, { sync: true })`**: o `schemaResolver` aceita qualquer biblioteca que siga o padrão **Standard Schema**, e o Zod 4 segue. Por isso não precisamos de pacote adaptador. O `{ sync: true }` pede validação síncrona: nosso schema não tem nenhuma regra que precise esperar algo (como consultar a API).

### 4.3 Ligando cada campo: `key` + `getInputProps`

```tsx
<TextInput key={form.key("nome")} {...form.getInputProps("nome")} />
```

- `form.getInputProps("nome")` devolve um objeto com `defaultValue`, `onChange`, `error`... e o `{...}` espalha tudo como props do `TextInput`. Uma linha conecta valor, mudança e mensagem de erro.
- `key={form.key("nome")}`: no modo *uncontrolled*, o campo não é controlado pelo estado do React, então o Mantine usa essa `key` para recriar o campo quando o valor muda por fora (no `reset`, por exemplo). Lembram do tutorial: quando a `key` muda, o React recria o componente.

### 4.4 O envio: `form.onSubmit(cadastrar)`

1. O usuário clica em **Cadastrar** (um `type="submit"` dentro do `<form>`).
2. `form.onSubmit` impede o recarregamento da página, roda a validação e só chama `cadastrar(valores)` se **tudo** passou. Se algo falhar, os erros aparecem embaixo dos campos e **nenhuma requisição é feita**.
3. `const { confirmarSenha: _, ...dados } = valores;` separa a confirmação do resto. O `...dados` junta os outros campos, e o `_` é a convenção para "variável que não vou usar".
4. Enquanto a `Promise` de `cadastrar` não termina, `form.submitting` fica `true` e o botão mostra um spinner (`loading`), o que evita clique duplo.

### 4.5 Tratando os erros da API

O front já valida tudo, então por que tratar erro da API?

- **CPF duplicado:** só o banco sabe disso. A API responde **400** `{ mensagem: "Já existe um secretário cadastrado com este CPF." }`, e mostramos isso no `Alert` vermelho.
- **Defesa em profundidade:** se a API recusar algum campo, os `detalhes` voltam campo a campo e o `form.setErrors` coloca cada mensagem **embaixo do campo certo**.
- **API fora do ar:** quando nem houve resposta, `e.response` não existe, e mostramos "Não foi possível conectar à API".

### 4.6 A prop `onIrParaLogin`

A página de cadastro **não sabe** como trocar de tela: quem decide qual tela aparece é o `App` (Parte 6). Ela só recebe uma função e a chama no clique do link. É o mesmo padrão do tutorial, em que o `Square` recebia `onSquareClick` do `Board`.

`<Anchor component="button" type="button">` é um link com cara de link, mas que por baixo é um `<button>`: não navega para outra URL, só dispara o `onClick`. O `type="button"` impede que ele envie o formulário.

### 4.7 O visual: card, cabeçalho e duas colunas

Três detalhes de layout deixam a tela com cara de sistema, e não de página em branco:

- **Style props.** Todo componente do Mantine aceita props de estilo curtas: `w="100%"` (largura), `maw={560}` (largura **máxima**, em px), `p="xl"` (padding), `mb="lg"` (margem embaixo), `c="dimmed"` (cor do texto). Juntas, `w="100%" maw={560}` dizem "ocupe a largura disponível, mas no máximo 560px": no celular o card encolhe, e no monitor grande ele não estica.
- **Cabeçalho do card.** Três linhas: o nome do sistema pequeno em azul (`Text c="blue" fw={700}`), o título da tela (`Title`) e uma frase de apoio em cinza (`Text c="dimmed"`). Usar `placeholder` em vez de `description` deixa a dica **dentro** do campo e economiza uma linha por campo.
- **`SimpleGrid` responsivo.** `cols={{ base: 1, sm: 2 }}` significa: 1 coluna por padrão (celular) e 2 colunas a partir do breakpoint `sm` (48em, cerca de 768px). Colocar CPF ao lado de Telefone e Senha ao lado de Confirmar deixa o formulário mais baixo, e ele cabe numa tela de notebook sem rolar. Os breakpoints são os mesmos que configuramos no `postcss.config.cjs`.

Quem centraliza o card na tela é o `App` (Parte 6). A página só diz o tamanho máximo do próprio card.

---

## 🔐 PARTE 5: A tela de login

Crie `frontend/src/pages/LoginPage.tsx`:

```tsx
import { useState } from "react";
import {
  Alert,
  Anchor,
  Button,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";
import axios from "axios";
import { loginSchema, type LoginInput } from "@clinica/shared/auth";
import type { Secretario } from "@clinica/shared/secretario";
import type { ErroApi } from "../services/api.ts";
import { login } from "../services/authService.ts";

type LoginPageProps = {
  onLogin: (secretario: Secretario) => void;
  onIrParaCadastro: () => void;
};

export function LoginPage({ onLogin, onIrParaCadastro }: LoginPageProps) {
  const [erro, setErro] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    mode: "uncontrolled",
    initialValues: { cpf: "", senha: "" },
    validate: schemaResolver(loginSchema, { sync: true }),
  });

  async function entrar(valores: LoginInput) {
    setErro(null);
    try {
      const secretario = await login(valores);
      onLogin(secretario);
    } catch (e) {
      if (axios.isAxiosError<ErroApi>(e) && e.response) {
        setErro(e.response.data.mensagem);
      } else {
        setErro("Não foi possível conectar à API. Ela está rodando?");
      }
    }
  }

  return (
    <Paper withBorder shadow="md" p="xl" radius="md" w="100%" maw={400}>
      <Text c="blue" fw={700} size="sm">
        Clínica Médica
      </Text>
      <Title order={2}>Entrar</Title>
      <Text c="dimmed" size="sm" mb="lg">
        Acesse com seu CPF e senha
      </Text>

      <form onSubmit={form.onSubmit(entrar)}>
        <Stack>
          {erro && <Alert color="red">{erro}</Alert>}

          <TextInput
            label="CPF"
            placeholder="Somente números"
            key={form.key("cpf")}
            {...form.getInputProps("cpf")}
          />
          <PasswordInput
            label="Senha"
            placeholder="Sua senha"
            key={form.key("senha")}
            {...form.getInputProps("senha")}
          />

          <Button type="submit" loading={form.submitting}>
            Entrar
          </Button>

          <Text size="sm" ta="center">
            Ainda não tem conta?{" "}
            <Anchor component="button" type="button" onClick={onIrParaCadastro}>
              Cadastre-se
            </Anchor>
          </Text>
        </Stack>
      </form>
    </Paper>
  );
}
```

**Peça para a turma comparar com o cadastro.** A estrutura é a mesma: `useForm` + `schemaResolver` + `onSubmit` + `try/catch`. O que muda:

- **O schema é o `loginSchema` do shared, direto**, sem `.extend()`: o formulário tem exatamente os campos que a API recebe. Por isso usamos o próprio `LoginInput` como tipo dos valores.
- **`onLogin(secretario)`**: quando a API responde 200, a página **não guarda** o secretário. Ela entrega para quem a chamou (o `App`). Quem decide o que fazer com o usuário logado é o `App`.
- **O erro 401 tem uma mensagem só**: "CPF ou senha inválidos", tanto para CPF inexistente quanto para senha errada. Pergunte para a turma por quê. (Se a API dissesse "CPF não encontrado", alguém poderia descobrir quais CPFs têm conta.)

---

## 🧩 PARTE 6: Juntando tudo no `App`

Crie `frontend/src/pages/HomePage.tsx`, a tela de quem está logado:

```tsx
import { Button, Paper, Stack, Text, Title } from "@mantine/core";
import type { Secretario } from "@clinica/shared/secretario";

type HomePageProps = {
  secretario: Secretario;
  onSair: () => void;
};

export function HomePage({ secretario, onSair }: HomePageProps) {
  return (
    <Paper withBorder shadow="md" p="xl" radius="md" w="100%" maw={400}>
      <Stack>
        <Title order={2}>Olá, {secretario.nome}!</Title>
        <Text c="dimmed">Você está logado(a) com o CPF {secretario.cpf}.</Text>
        <Button variant="light" color="red" onClick={onSair}>
          Sair
        </Button>
      </Stack>
    </Paper>
  );
}
```

E substitua `frontend/src/App.tsx` por:

```tsx
import { useState } from "react";
import { Center } from "@mantine/core";
import type { Secretario } from "@clinica/shared/secretario";
import { CadastroSecretarioPage } from "./pages/CadastroSecretarioPage.tsx";
import { HomePage } from "./pages/HomePage.tsx";
import { LoginPage } from "./pages/LoginPage.tsx";

type Tela = "login" | "cadastro";

export default function App() {
  // null = ninguém logado
  const [secretario, setSecretario] = useState<Secretario | null>(null);
  const [tela, setTela] = useState<Tela>("login");

  return (
    // Fundo cinza na tela inteira, com o card centralizado na horizontal e na vertical
    <Center mih="100vh" bg="gray.1" p="md">
      {secretario ? (
        <HomePage secretario={secretario} onSair={() => setSecretario(null)} />
      ) : tela === "login" ? (
        <LoginPage
          onLogin={setSecretario}
          onIrParaCadastro={() => setTela("cadastro")}
        />
      ) : (
        <CadastroSecretarioPage onIrParaLogin={() => setTela("login")} />
      )}
    </Center>
  );
}
```

**Este é o arquivo mais importante da aula: é o tutorial do react.dev aplicado.**

- **Dois estados, no componente de cima.** `secretario` diz **quem está logado** (`null` = ninguém), e `tela` diz qual formulário mostrar. Ficam no `App` porque são eles que decidem qual tela aparece, e as telas só **avisam** o que aconteceu. É o "subir o estado" do jogo da velha: o `Board` guardava os quadrados, e o `Square` só avisava o clique.
- **Funções como props.** `onLogin={setSecretario}` entrega a própria função de atualizar o estado: quando a `LoginPage` chama `onLogin(secretario)`, o `App` re-renderiza com o secretário preenchido e a `HomePage` aparece. `onSair={() => setSecretario(null)}` faz o caminho inverso.
- **Renderização condicional.** O ternário encadeado (`a ? X : b ? Y : Z`) escolhe entre três telas. Leia em voz alta com a turma: "tem secretário? mostra a Home. Senão, a tela é login? mostra o Login. Senão, mostra o Cadastro".
- **`type Tela = "login" | "cadastro"`**: o TypeScript só aceita esses dois valores. Um `setTela("cadstro")` com erro de digitação não compila.
- **`<Center mih="100vh" bg="gray.1" p="md">`** pinta a tela inteira de cinza claro e centraliza o card nas duas direções. O `mih="100vh"` (altura mínima = 100% da altura da janela) é o que permite centralizar na vertical: sem ele, o `Center` teria só a altura do card, e o card ficaria colado no topo.

### Limitações, de propósito

Este login é **simples por escolha**, para focar no React. Mostre os limites para a turma:

1. **Aperte F5 logado:** volta para a tela de login. O `useState` vive na memória da página, e recarregar zera tudo (ver Exercício 1).
2. **A API não sabe quem está logado.** Quem "lembra" do login é só o front. As outras rotas (`/pacientes`, `/consultas`...) continuam abertas para qualquer um. Proteger a API exige um token (como JWT), assunto para outra aula.

---

## 🧪 PARTE 7: Testando em sala

Na raiz, com a API rodando:

```bash
npm run dev -w frontend
```

Abra `http://localhost:5173` com o DevTools aberto (F12, aba **Rede/Network**):

| # | O que fazer | O que deve acontecer |
| :--- | :--- | :--- |
| 1 | Clicar **Entrar** com tudo vazio | Mensagens embaixo dos campos e **nenhuma** requisição na aba Rede: o Zod barrou no navegador |
| 2 | Entrar com um CPF que não existe | Alerta "CPF ou senha inválidos" e `POST /auth/login` **401** |
| 3 | **Cadastre-se** → enviar vazio, depois CPF `123` e senhas diferentes | Uma mensagem por campo, incluindo "As senhas não conferem" |
| 4 | Cadastro com dados válidos e e-mail **vazio** | Alerta verde, formulário limpo e `POST /secretarios` **201** |
| 5 | Repetir o mesmo cadastro | Alerta "Já existe um secretário cadastrado com este CPF." (**400**) |
| 6 | **Entrar** → senha errada | "CPF ou senha inválidos" (**401**) |
| 7 | Senha certa | "Olá, *nome*!" (**200**) |
| 8 | **Sair** | Volta para a tela de login |
| 9 | Logado, apertar F5 | Volta para o login (limitação 1) |

**Pergunta para a turma:** no cenário 1, quem validou: o front ou a API? E se alguém mudar a regra do CPF em `shared/src/secretario.ts`, onde a mudança aparece? (Nos dois lados ao mesmo tempo. Façam o teste.)

---

## 📝 Exercícios

1. **Continuar logado após o F5:** salve o secretário no `localStorage` no login (`localStorage.setItem("secretario", JSON.stringify(s))`), leia no valor inicial do `useState` e apague no Sair. Discuta: guardar dados do usuário no navegador é seguro?
2. **Do cadastro direto para o login:** depois do cadastro com sucesso, leve o usuário para a tela de login com o CPF já preenchido. (Dica: o `App` precisa guardar o CPF e passar como prop para a `LoginPage`, que usa no `initialValues`.)
3. **Mostrar/ocultar as duas senhas juntas:** no cadastro, faça os dois `PasswordInput` alternarem juntos ao clicar no olho (dica: `visible` e `onVisibilityChange`, com `useDisclosure` do `@mantine/hooks`).
4. **Tela de cadastro de médico:** monte `CadastroMedicoPage` usando o `medicoSchema` do shared. Quantas regras de validação você precisou escrever?

---

## 📋 Resumo

| Conceito | Onde apareceu |
| :--- | :--- |
| Workspaces + `shared/` | `npm install -w frontend ...` e `import ... from "@clinica/shared/..."` |
| Mantine | `MantineProvider`, `Paper`, `TextInput`, `PasswordInput`, `Alert`, `Button` |
| Formulário com validação | `useForm` + `schemaResolver` com o **mesmo schema da API** |
| Chamadas HTTP | `axios.create` + `services/` |
| Tratamento de erro | `axios.isAxiosError` + `form.setErrors` + `Alert` |
| Props e estado | `App` guarda quem está logado e a tela; as páginas avisam via `onLogin`, `onSair`, `onIrPara...` |
| Renderização condicional | Ternário escolhendo Home, Login ou Cadastro |
