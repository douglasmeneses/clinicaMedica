import type { Request, Response, NextFunction } from "express";
import { type ZodType } from "zod";

/**
 * Middleware que recebe um schema do Zod e valida o corpo (req.body) da requisição.
 */
export function validarBody(schema: ZodType) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Usamos safeParseAsync para validar sem estourar exceção
    const resultado = await schema.safeParseAsync(req.body);

    if (!resultado.success) {
      const errosFormatados = resultado.error.issues.map((issue) => ({
        campo: issue.path.join("."),
        mensagem: issue.message,
      }));

      return res.status(400).json({
        status: "erro_validacao",
        mensagem: "Os dados enviados são inválidos",
        detalhes: errosFormatados,
      });
    }

    // Atribui os dados validados e tratados pelo Zod ao req.body
    req.body = resultado.data;
    return next();
  };
}
