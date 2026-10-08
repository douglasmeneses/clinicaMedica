import swaggerJSDoc, { type Options } from "swagger-jsdoc";

const swaggerOptions: Options = {
  definition: {
    openapi: "3.0.0",
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
  apis: ["./src/routes/*.ts", "./dist/routes/*.js"],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);
