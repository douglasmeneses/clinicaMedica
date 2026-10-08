import type { Request, Response, NextFunction } from "express";
import { ZodError, type ZodSchema } from "zod";

/**
 * Middleware que recebe um schema do Zod e valida o corpo (req.body) da requisição.
 */
export function validarBody(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const resultado = await schema.parseAsync(req.body);
      req.body = resultado;
      return next();
    } catch (erro) {
      if (erro instanceof ZodError) {
        const errosFormatados = erro.issues.map((issue) => ({
          campo: issue.path.join("."),
          mensagem: issue.message,
        }));

        return res.status(400).json({
          status: "erro_validacao",
          mensagem: "Os dados enviados são inválidos",
          detalhes: errosFormatados,
        });
      }

      return next(erro);
    }
  };
}
