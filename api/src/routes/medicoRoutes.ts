import Router from "express";
import * as controller from "../controllers/medicoController.js";
import { validarBody } from "../middlewares/validarSchema.js";
import { medicoSchema } from "@clinica/shared/medico";

const router = Router();

router.get("/medicos", controller.listar);
router.get("/medicos/:id", controller.buscarPorId);
router.post("/medicos", validarBody(medicoSchema), controller.cadastrar);
router.put("/medicos/:id", validarBody(medicoSchema), controller.atualizar);
router.delete("/medicos/:id", controller.deletar);

export default router;
