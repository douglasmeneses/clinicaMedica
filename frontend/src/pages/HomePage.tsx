import { useState } from "react";
import { MenuLateral } from "../components/MenuLateral";
import { ConsultasPage } from "./ConsultasPage";
import { PacientesPage } from "./PacientesPage";

type Props = {
  nome: string;
  onSair: () => void;
};

export function HomePage({ nome, onSair }: Props) {
  // Qual tela aparece no meio: "consultas" ou "pacientes"
  const [pagina, setPagina] = useState("consultas");

  return (
    <MenuLateral
      nome={nome}
      onSair={onSair}
      pagina={pagina}
      onTrocarPagina={setPagina}
    >
      {pagina === "consultas" && <ConsultasPage />}
      {pagina === "pacientes" && <PacientesPage />}
    </MenuLateral>
  );
}
