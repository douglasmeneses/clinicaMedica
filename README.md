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
├── prisma/               # Schema e migrações do Prisma
├── src/
│   ├── controllers/      # Recebimento de requisições e respostas HTTP
│   ├── repositories/     # Interface direta de persistência com o banco
│   ├── routes/           # Mapeamento e declaração das rotas Express
│   ├── services/         # Regras de negócio e validações
│   └── server.ts         # Ponto de entrada e inicialização do servidor
├── docker-compose.yml    # Orquestração do banco PostgreSQL
├── package.json
└── tsconfig.json
```

---

## 🛠️ Tecnologias Utilizadas

- **Runtime & Linguagem:** [Node.js](https://nodejs.org/) (v20+) & [TypeScript](https://www.typescriptlang.org/)
- **Framework Web:** [Express](https://expressjs.com/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Validação:** [Zod](https://zod.dev/)
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

### 2. Instalar as dependências
```bash
npm install
```

### 3. Subir o banco de dados via Docker
```bash
docker compose up -d
```

### 4. Configurar variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto com a URL de conexão:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/clinica?schema=public"
PORT=3000
```

### 5. Executar as migrações do Prisma
```bash
npx prisma migrate dev
```

### 6. Iniciar a aplicação em modo de desenvolvimento
```bash
npm run dev
```

A API estará acessível em `http://localhost:3000`.

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

---

## 👨‍💻 Autor

Desenvolvido por **Douglas Meneses**.

- 💼 GitHub: [@douglasmeneses](https://github.com/douglasmeneses)
- ✉️ Email: [meneses.doug@gmail.com](mailto:meneses.doug@gmail.com)
