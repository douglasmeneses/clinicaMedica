# 🏥 Clínica Médica — API REST

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

API RESTful para gestão de clínica médica desenvolvida em **Node.js** e **TypeScript**, aplicando boas práticas de arquitetura em camadas (Controllers, Services e Repositories), validação com **Zod**, persistência com **Prisma ORM** e banco de dados **PostgreSQL** containerizado via Docker.

---

## 📌 Funcionalidades

- 🧑‍⚕️ **Gestão de Pacientes**: Cadastro, listagem, busca por identificador, atualização cadastral e remoção.
- 🩺 **Gestão de Médicos**: Cadastro, listagem, busca por identificador, atualização cadastral e remoção.
- 📐 **Arquitetura em Camadas**: Separação clara de responsabilidades entre rotas, controladores, regras de negócio (serviços) e acesso a dados (repositórios).
- 🔒 **Validação de Dados**: Validação e tipagem de entrada via Zod.
- 🐘 **Persistência Relacional**: Modelagem e queries gerenciadas via Prisma ORM integrado ao PostgreSQL.
- 🐳 **Ambiente Conteinerizado**: Inicialização ágil do banco de dados local com Docker Compose.

---

## 🏗️ Arquitetura do Projeto

```text
clinicaMedica/
├── package.json          # Raiz: npm workspaces (shared, api, frontend)
├── docker-compose.yml    # Orquestração do banco PostgreSQL
├── shared/               # Schemas Zod e tipos usados pela API e pelo frontend
│   └── src/
├── api/                  # Backend (Express + Prisma)
│   ├── prisma/           # Schema do Prisma
│   └── src/
│       ├── config/       # Prisma Client e Swagger
│       ├── controllers/  # Recebimento de requisições e respostas HTTP
│       ├── middlewares/  # Validação do body com Zod
│       ├── repositories/ # Interface direta de persistência com o banco
│       ├── routes/       # Mapeamento e declaração das rotas Express
│       ├── services/     # Regras de negócio
│       └── server.ts     # Ponto de entrada e inicialização do servidor
└── frontend/             # React + Vite + Mantine
    └── src/
        ├── pages/        # Telas (login, cadastro, home)
        └── services/     # Chamadas à API (axios)
```

---

## 🛠️ Tecnologias Utilizadas

- **Runtime & Linguagem:** [Node.js](https://nodejs.org/) (v20+) & [TypeScript](https://www.typescriptlang.org/)
- **Framework Web:** [Express](https://expressjs.com/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Validação:** [Zod](https://zod.dev/) (schemas compartilhados entre API e frontend em `shared/`)
- **Frontend:** [React](https://react.dev/) + [Vite](https://vite.dev/) + [Mantine](https://mantine.dev/)
- **Senhas:** [bcryptjs](https://github.com/dcodeIO/bcrypt.js) (hash)
- **Banco de Dados:** [PostgreSQL 16](https://www.postgresql.org/)
- **Execução & Dev:** [tsx](https://github.com/privatenumber/tsx) (Fast TypeScript execution)
- **Containerização:** [Docker & Docker Compose](https://www.docker.com/)

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- [Node.js](https://nodejs.org/) (v20 ou superior)
- [npm](https://www.npmjs.com/) ou [pnpm](https://pnpm.io/)
- [Docker & Docker Compose](https://www.docker.com/) instalados e em execução

### 1. Clonar o repositório
```bash
git clone https://github.com/douglasmeneses/clinicaMedica.git
cd clinicaMedica
```

### 2. Instalar as dependências (na raiz, instala os três workspaces)
```bash
npm install
```

### 3. Subir o banco de dados via Docker
```bash
docker compose up -d
```

### 4. Configurar variáveis de ambiente
Crie o arquivo `api/.env` com a URL de conexão:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/clinica?schema=public"
PORT=3000
```

### 5. Gerar o Prisma Client e sincronizar o banco
```bash
cd api
npx prisma generate
npx prisma db push
cd ..
```

### 6. Iniciar a API em modo de desenvolvimento
```bash
npm run dev -w api
```

A API estará acessível em `http://localhost:3000` e a documentação em `http://localhost:3000/docs`.

### 7. Iniciar o frontend
Em outro terminal, também na raiz:
```bash
npm run dev -w frontend
```

O frontend estará acessível em `http://localhost:5173`. Para apontar para outra URL da API, crie `frontend/.env` a partir de `frontend/.env.example`.

---

## 📡 Rotas da API (Endpoints)

### Pacientes

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/pacientes` | Lista todos os pacientes cadastrados |
| `GET` | `/pacientes/:id` | Retorna os detalhes de um paciente específico |
| `POST` | `/pacientes` | Cadastra um novo paciente |
| `PUT` | `/pacientes/:id` | Atualiza os dados de um paciente existente |
| `DELETE` | `/pacientes/:id` | Remove um paciente da base de dados |

### Médicos

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/medicos` | Lista todos os médicos cadastrados |
| `GET` | `/medicos/:id` | Retorna os detalhes de um médico específico |
| `POST` | `/medicos` | Cadastra um novo médico |
| `PUT` | `/medicos/:id` | Atualiza os dados de um médico existente |
| `DELETE` | `/medicos/:id` | Remove um médico da base de dados |

### Autenticação

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `POST` | `/auth/login` | Recebe `cpf` e `senha` e devolve o secretário (sem a senha). `401` se não conferem |

Secretários são cadastrados com senha (`POST /secretarios`), guardada como hash bcrypt. Secretários cadastrados antes da senha existir ficam sem senha e não conseguem fazer login.

---

## 👨‍💻 Autor

Desenvolvido por **Douglas Meneses**.

- 💼 GitHub: [@douglasmeneses](https://github.com/douglasmeneses)
- ✉️ Email: [meneses.doug@gmail.com](mailto:meneses.doug@gmail.com)
