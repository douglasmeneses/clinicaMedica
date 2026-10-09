import Router from "express";
import * as controller from "../controllers/secretarioController.js";

const router = Router();

router.get("/secretarios", controller.listar);
router.get("/secretarios/:id", controller.buscarPorId);
router.post("/secretarios", controller.cadastrar);
router.put("/secretarios/:id", controller.atualizar);
router.delete("/secretarios/:id", controller.deletar);

export default router;
