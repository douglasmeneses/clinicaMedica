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
