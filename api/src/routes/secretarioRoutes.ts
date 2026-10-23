import Router from "express";
import * as controller from "../controllers/secretarioController.js";
import { validarBody } from "../middlewares/validarSchema.js";
import { secretarioSchema } from "../schemas/secretarioSchema.js";

const router = Router();

router.get("/secretarios", controller.listar);
router.get("/secretarios/:id", controller.buscarPorId);
router.post("/secretarios", validarBody(secretarioSchema), controller.cadastrar);
router.put("/secretarios/:id", validarBody(secretarioSchema), controller.atualizar);
router.delete("/secretarios/:id", controller.deletar);

export default router;
