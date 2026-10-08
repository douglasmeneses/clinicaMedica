import Router from "express";
import * as controller from "../controllers/consultaController.js";

const router = Router();

router.get("/consultas", controller.listar);
router.get("/consultas/:id", controller.buscarPorId);
router.post("/consultas", controller.cadastrar);
router.put("/consultas/:id", controller.atualizar);
router.delete("/consultas/:id", controller.deletar);

export default router;
