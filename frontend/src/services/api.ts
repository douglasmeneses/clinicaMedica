import axios from "axios";

// Instância única do axios: a URL base fica num lugar só
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

// Formato dos erros que a API devolve (middleware validarBody e handler global)
export interface ErroApi {
  mensagem: string;
  detalhes?: { campo: string; mensagem: string }[];
}
