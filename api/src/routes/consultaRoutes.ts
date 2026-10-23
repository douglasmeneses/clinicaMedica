import Router from "express";
import * as controller from "../controllers/consultaController.js";
import { validarBody } from "../middlewares/validarSchema.js";
import { consultaSchema } from "../schemas/consultaSchema.js";

const router = Router();

router.get("/consultas", controller.listar);
router.get("/consultas/:id", controller.buscarPorId);
router.post("/consultas", validarBody(consultaSchema), controller.cadastrar);
router.put("/consultas/:id", validarBody(consultaSchema), controller.atualizar);
router.delete("/consultas/:id", controller.deletar);

export default router;
