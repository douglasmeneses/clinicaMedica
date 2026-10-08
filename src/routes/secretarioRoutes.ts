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
 *         description: Erro de validação de dados
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
 *         description: Secretário removido com sucesso
 *       404:
 *         description: Secretário não encontrado
 */
router.delete("/secretarios/:id", controller.deletar);

export default router;
