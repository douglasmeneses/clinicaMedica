import express, { type Request, type Response, type NextFunction } from "express";
import dotenv from "dotenv";
import pacienteRoutes from "./routes/pacienteRoutes.js";
import medicoRoutes from "./routes/medicoRoutes.js";
import secretarioRoutes from "./routes/secretarioRoutes.js";
import consultaRoutes from "./routes/consultaRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());

const PORT: number = Number(process.env.PORT || 3000);

app.use(pacienteRoutes);
app.use(medicoRoutes);
app.use(secretarioRoutes);
app.use(consultaRoutes);

// Middleware global de tratamento de erros
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  return res.status(400).json({ mensagem: err.message });
});

app.listen(PORT, () => {
  console.log(`A API subiu na porta ${PORT}`);
});
