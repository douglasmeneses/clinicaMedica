import { useState } from "react";
import { AppShell, NavLink, Text, Title } from "@mantine/core";
import PacientesPage from "./pages/PacientesPage.tsx";

type Pagina = "pacientes" | "medicos" | "consultas";

export default function App() {
  const [pagina, setPagina] = useState<Pagina>("pacientes");

  return (
    <AppShell header={{ height: 60 }} navbar={{ width: 220, breakpoint: "sm" }} padding="md">
      <AppShell.Header p="md">
        <Title order={3}>🏥 Clínica Médica</Title>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <NavLink label="Pacientes" active={pagina === "pacientes"} onClick={() => setPagina("pacientes")} />
        <NavLink label="Médicos" active={pagina === "medicos"} onClick={() => setPagina("medicos")} />
        <NavLink label="Consultas" active={pagina === "consultas"} onClick={() => setPagina("consultas")} />
      </AppShell.Navbar>

      <AppShell.Main>
        {pagina === "pacientes" && <PacientesPage />}
        {pagina !== "pacientes" && <Text c="dimmed">Em construção…</Text>}
      </AppShell.Main>
    </AppShell>
  );
}
