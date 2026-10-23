import { useState } from "react";
import { Container } from "@mantine/core";
import type { Secretario } from "@clinica/shared/secretario";
import { CadastroSecretarioPage } from "./pages/CadastroSecretarioPage.tsx";
import { HomePage } from "./pages/HomePage.tsx";
import { LoginPage } from "./pages/LoginPage.tsx";

type Tela = "login" | "cadastro";

export default function App() {
  // null = ninguém logado
  const [secretario, setSecretario] = useState<Secretario | null>(null);
  const [tela, setTela] = useState<Tela>("login");

  return (
    <Container size="xs" py="xl">
      {secretario ? (
        <HomePage secretario={secretario} onSair={() => setSecretario(null)} />
      ) : tela === "login" ? (
        <LoginPage
          onLogin={setSecretario}
          onIrParaCadastro={() => setTela("cadastro")}
        />
      ) : (
        <CadastroSecretarioPage onIrParaLogin={() => setTela("login")} />
      )}
    </Container>
  );
}
