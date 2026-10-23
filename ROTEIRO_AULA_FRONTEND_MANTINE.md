# 📘 Roteiro de Aula: Primeiro Frontend da Clínica com REACT + MANTINE

> **Objetivo da Aula:**  
> Criar o frontend da Clínica Médica com **React + Vite + TypeScript**, usar a biblioteca de componentes **Mantine** para não perder tempo com CSS e fazer a primeira tela conversar com a nossa API: a **listagem de pacientes**.

> **Pré-requisito:** o tutorial do [react.dev](https://react.dev/learn/tutorial-tic-tac-toe). Hoje vamos usar exatamente o que vocês viram lá: **componentes**, **props**, **`useState`**, **renderização condicional** e **listas com `map` + `key`**. A novidade é o **`useEffect`**.

---

## 🎯 Por que uma biblioteca de componentes?

A nossa clínica é, no fundo, um sistema de cadastro: tabelas, formulários, modais, menus. Se formos estilizar tudo na mão, a aula vira aula de CSS.

O **Mantine** entrega esses componentes prontos e tipados em TypeScript:
- `AppShell` → o "esqueleto" da tela (cabeçalho + menu lateral + conteúdo).
- `Table`, `Loader`, `Alert`, `NavLink`, `Title`... → peças prontas que só recebem **props**.
- Mais pra frente: `TextInput`, `Select`, `Modal` e o `@mantine/form` para os formulários de cadastro.

> 💡 Repare: um componente do Mantine é **um componente React igual aos que vocês fizeram no tutorial**. `<Button color="red">` é a mesma ideia do `<Square value="X" />`.

---

## 🗂️ Passo 0: Organizando o repositório (`api/` + `frontend/`)

Até agora o repositório era só o backend. Vamos separar as duas aplicações, cada uma com o seu `package.json`:

```text
clinicaMedica/
├── api/                # o backend que já existia (Express + Prisma + Zod)
├── frontend/           # o React que vamos criar hoje
└── docker-compose.yml  # o banco continua na raiz, é infraestrutura das duas
```

Movendo o backend (usamos `git mv` para o Git entender que é o **mesmo arquivo mudando de lugar**, e não um arquivo apagado e outro criado):

```bash
mkdir api
git mv src prisma prisma.config.ts package.json package-lock.json tsconfig.json api/
mv .env node_modules api/    # não estão no Git, então é mv normal
```

A partir de agora, os comandos do backend rodam **dentro de `api/`**:

```bash
cd api
npm run dev
```

---

## 📦 Passo 1: Criando o projeto React com Vite

Na raiz do repositório:

```bash
npm create vite@latest frontend -- --template react-ts --no-interactive
cd frontend
npm install
```

> Sem o `--no-interactive`, o Vite pergunta qual linter usar e se já quer instalar e iniciar. Com ele, fica o padrão (Oxlint) e nós instalamos manualmente.

O Vite gera um projeto de exemplo. Vamos limpar o que não usaremos:

```bash
rm -rf src/App.css src/index.css src/assets README.md
```

E no `frontend/index.html`, troque `lang="en"` por `lang="pt-BR"` e o `<title>` por `Clínica Médica`.

### O que é o Vite?
É a ferramenta que **compila o TypeScript/JSX** e **serve a aplicação** no navegador (`http://localhost:5173`), recarregando a tela a cada vez que salvamos um arquivo. É o "`tsx watch`" do frontend.

---

## 🎨 Passo 2: Instalando o Mantine

```bash
npm install @mantine/core @mantine/hooks
npm install --save-dev postcss postcss-preset-mantine postcss-simple-vars
```

### O que cada pacote faz?
- **`@mantine/core`**: os componentes (`Table`, `AppShell`, `Button`...).
- **`@mantine/hooks`**: hooks utilitários usados internamente pelo core (e úteis pra nós depois).
- **`postcss-preset-mantine` / `postcss-simple-vars`**: plugins de CSS que o Mantine usa (breakpoints, funções de tamanho). O Vite lê esse arquivo sozinho.

Crie o arquivo **`frontend/postcss.config.cjs`**:

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

> ❓ **Por que `.cjs`?** O `package.json` do Vite tem `"type": "module"`. O `.cjs` avisa ao Node que *este* arquivo usa a sintaxe antiga (`module.exports`).

---

## 🧩 Passo 3: Ligando o Mantine na aplicação (`main.tsx`)

Todo componente do Mantine precisa estar **dentro** de um `MantineProvider`, que distribui o tema (cores, fontes, espaçamentos) para a árvore inteira.

**`frontend/src/main.tsx`**:

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

#### 🔍 Explicando:
- **`import "@mantine/core/styles.css"`**: sem essa linha os componentes aparecem "pelados", sem estilo. É o erro nº 1 de quem começa com Mantine!
- **`<MantineProvider>`**: um componente que "abraça" o `App`. Tudo que estiver dentro dele recebe o tema.

---

## 🏗️ PARTE 1: O Layout com `AppShell` e a navegação com `useState`

**`frontend/src/App.tsx`**:

```tsx
import { useState } from "react";
import { AppShell, NavLink, Text, Title } from "@mantine/core";
import PacientesPage from "./pages/PacientesPage.tsx";

type Pagina = "pacientes" | "medicos" | "consultas";

export default function App() {
  const [pagina, setPagina] = useState<Pagina>("pacientes");

  return (
    <AppShell header={{ height: 60 }} navbar={{ width: 220, breakpoint: "sm" }} padding="md">
      <AppShell.Header p="md">
        <Title order={3}>🏥 Clínica Médica</Title>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <NavLink label="Pacientes" active={pagina === "pacientes"} onClick={() => setPagina("pacientes")} />
        <NavLink label="Médicos" active={pagina === "medicos"} onClick={() => setPagina("medicos")} />
        <NavLink label="Consultas" active={pagina === "consultas"} onClick={() => setPagina("consultas")} />
      </AppShell.Navbar>

      <AppShell.Main>
        {pagina === "pacientes" && <PacientesPage />}
        {pagina !== "pacientes" && <Text c="dimmed">Em construção…</Text>}
      </AppShell.Main>
    </AppShell>
  );
}
```

#### 🔍 Explicando linha por linha:
- **`type Pagina = "pacientes" | "medicos" | "consultas"`**: um *union type* do TypeScript. O `useState<Pagina>` só aceita esses três valores; um `setPagina("medico")` (sem o "s") dá erro de compilação.
- **`AppShell.Header` / `AppShell.Navbar` / `AppShell.Main`**: as três regiões da tela. As props `header` e `navbar` do `AppShell` dizem o tamanho de cada uma.
- **`p="md"`, `padding="md"`**: espaçamentos do tema (`xs`, `sm`, `md`, `lg`, `xl`) em vez de pixels soltos.
- **`active={pagina === "pacientes"}`**: o item do menu fica destacado quando é a página atual. É uma **prop booleana calculada a partir do estado**.
- **`{pagina === "pacientes" && <PacientesPage />}`**: **renderização condicional**, igual ao tutorial. Mudou o estado → o React redesenha → outra página aparece.

> 💡 Hoje a navegação é só um `useState`. Quando a aplicação crescer (URL por página, botão "voltar" do navegador), trocamos por uma biblioteca de rotas, como o **React Router**.

---

## 🌐 PARTE 2: Buscando os pacientes na API

### 2.1 O tipo `Paciente`

**`frontend/src/types/paciente.ts`**:

```ts
export interface Paciente {
  id: number;
  nome: string;
  cpf: string;
  telefone: string;
}
```

> É o "espelho" do que o `GET /pacientes` devolve. Confira no Swagger (`http://localhost:3000/docs`)!

### 2.2 Isolando a chamada HTTP (`services/api.ts`)

Assim como no backend separamos `controller` de `repository`, no front separamos **tela** de **acesso à API**:

**`frontend/src/services/api.ts`**:

```ts
import type { Paciente } from "../types/paciente.ts";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function listarPacientes(): Promise<Paciente[]> {
  const resposta = await fetch(`${API_URL}/pacientes`);
  if (!resposta.ok) {
    throw new Error(`Erro ao buscar pacientes (HTTP ${resposta.status})`);
  }
  return resposta.json();
}
```

#### 🔍 Explicando:
- **`import.meta.env.VITE_API_URL`**: variável de ambiente do Vite (arquivo `frontend/.env`, veja o `.env.example`). Só variáveis que começam com **`VITE_`** chegam ao navegador. Nunca coloque segredo aqui: tudo que vai pro front, o usuário consegue ler.
- **`if (!resposta.ok)`**: o `fetch` **não** lança erro em 404 ou 500, só em falha de rede. Quem verifica o status somos nós.

### 2.3 A tela: `useState` + `useEffect` + `Table`

**`frontend/src/pages/PacientesPage.tsx`**:

```tsx
import { useEffect, useState } from "react";
import { Alert, Loader, Table, Title } from "@mantine/core";
import { listarPacientes } from "../services/api.ts";
import type { Paciente } from "../types/paciente.ts";

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    listarPacientes()
      .then(setPacientes)
      .catch((e: Error) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, []);

  if (carregando) return <Loader />;
  if (erro) return <Alert color="red" title="Ops!">{erro}</Alert>;

  return (
    <>
      <Title order={2} mb="md">
        Pacientes
      </Title>
      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nome</Table.Th>
            <Table.Th>CPF</Table.Th>
            <Table.Th>Telefone</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {pacientes.map((paciente) => (
            <Table.Tr key={paciente.id}>
              <Table.Td>{paciente.nome}</Table.Td>
              <Table.Td>{paciente.cpf}</Table.Td>
              <Table.Td>{paciente.telefone}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </>
  );
}
```

#### 🔍 Explicando linha por linha:
- **Três estados** descrevem tudo que a tela pode ser: *carregando*, *deu erro* ou *mostrando a lista*.
- **`useEffect(() => { ... }, [])`**: a novidade da aula. O corpo do componente roda a **cada** renderização; buscar dados ali criaria um loop infinito (busca → `setPacientes` → renderiza → busca...). O `useEffect` com **array de dependências vazio `[]`** diz: *"rode isso uma vez, depois que a tela aparecer"*.
- **`.then(setPacientes)`**: passa a função de atualizar o estado direto como callback. É o mesmo que `.then((lista) => setPacientes(lista))`.
- **`if (carregando) return <Loader />`**: *early return*, o jeito mais legível de fazer renderização condicional com vários estados.
- **`pacientes.map(...)` com `key={paciente.id}`**: a lista do tutorial! A `key` usa o **id do banco**, que é único e estável.

> 🧐 **Pergunta para a turma:** abram a aba *Network* do DevTools. Por que aparecem **duas** requisições para `/pacientes`?  
> **Resposta:** em desenvolvimento, o `<StrictMode>` monta o componente duas vezes de propósito, para revelar efeitos mal escritos. Em produção (`npm run build`) acontece uma vez só.

---

## 🚧 PARTE 3: O erro de CORS (e por que ele existe)

Suba os dois lados e abra `http://localhost:5173`:

```bash
# terminal 1
cd api && npm run dev

# terminal 2
cd frontend && npm run dev
```

**Antes de configurar o CORS**, a tela mostra o `Alert` vermelho e o console do navegador diz algo como:

```text
Access to fetch at 'http://localhost:3000/pacientes' from origin 'http://localhost:5173'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present...
```

> 🤔 **Mas no Swagger e no Postman funcionava!** Exato: o CORS é uma regra **do navegador**. Uma página em `localhost:5173` (origem A) só pode ler a resposta de `localhost:3000` (origem B) se a API **autorizar explicitamente** a origem A. Portas diferentes = origens diferentes.

### A correção (no backend)

```bash
cd api
npm install cors
npm install --save-dev @types/cors
```

**`api/src/server.ts`**:

```ts
import cors from "cors";

// ...
const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json());
```

#### 🔍 Explicando:
- **`origin`**: lista **quem** pode chamar a API pelo navegador. Liberamos só o nosso frontend, não o mundo inteiro (`cors()` sem opções libera qualquer site).
- **`process.env.FRONTEND_URL`**: quando o front for publicado em outro endereço, basta mudar o `.env` da API.

Recarregue a página: a tabela de pacientes aparece. 🎉

Para conferir pelo terminal, sem navegador:

```bash
curl -i -H "Origin: http://localhost:5173" http://localhost:3000/pacientes
# procure o cabeçalho: Access-Control-Allow-Origin: http://localhost:5173
```

---

## 🧪 PARTE 4: Testando em Sala de Aula

### Teste 1: Lista vazia × lista com dados
Cadastre um paciente pelo Swagger (`POST /pacientes`) e recarregue o front. A nova linha aparece.

### Teste 2: API fora do ar
Pare a API (`Ctrl+C` no terminal 1) e recarregue o front. O `Alert` vermelho aparece no lugar da tabela: é o estado `erro` funcionando.

### Teste 3: Navegação
Clique em **Médicos** e **Consultas**: o menu muda de item ativo e o conteúdo vira "Em construção…". Abra o React DevTools e veja o estado `pagina` mudando.

---

## 🏋️ Exercícios

1. **Tela de Médicos:** crie `types/medico.ts`, a função `listarMedicos()` em `services/api.ts` e a `pages/MedicosPage.tsx` (colunas: Nome, CRM, Especialidade). Ligue no `App.tsx`.
2. **Contador:** mostre o total de pacientes ao lado do título usando o componente `Badge` do Mantine.
3. **Lista vazia:** quando `pacientes.length === 0`, mostre uma mensagem amigável em vez de uma tabela vazia.
4. **Desafio:** adicione uma coluna "Ações" com um `Button` vermelho de excluir que chama `DELETE /pacientes/:id` e remove a linha da tela **sem recarregar a página** (dica: `setPacientes` + `filter`).

---

## 🔜 Próxima aula

**Formulário de cadastro** com `TextInput`, `Modal` e `@mantine/form`, validando com o **mesmo Zod** que já protege a API. A mesma regra vale no back e no front.

---

## 📋 Resumo: o que cada peça faz

| Peça | Papel | Paralelo no backend |
| :--- | :--- | :--- |
| `pages/PacientesPage.tsx` | Tela: estado + JSX | `controller` |
| `services/api.ts` | Fala com a API via `fetch` | `repository` |
| `types/paciente.ts` | Formato do dado | `types/paciente.ts` (DTO) |
| `MantineProvider` | Tema global | `app.use(...)` global |
| `useEffect(..., [])` | Buscar dados ao abrir a tela | — |
| `cors({ origin })` | Autoriza o front a ler a API | — |
