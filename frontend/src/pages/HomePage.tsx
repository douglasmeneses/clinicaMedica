import { Button, Group } from "@mantine/core";
import { MenuLateral } from "../components/MenuLateral";
import { useState } from "react";
import { PacientesPage } from "./PacientesPage";
import { ConsultasPage } from "./ConsultasPage";

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
      {pagina === "pacientes" && <PacientesPage />}

      {pagina === "consultas" && <ConsultasPage />}
    </MenuLateral>
  );
}
