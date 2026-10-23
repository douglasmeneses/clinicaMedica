import { useState } from "react";
import { Center } from "@mantine/core";
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
    // Fundo cinza na tela inteira, com o card centralizado na horizontal e na vertical
    <Center mih="100vh" bg="gray.1" p="md">
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
    </Center>
  );
}
