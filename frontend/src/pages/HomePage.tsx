import { Alert, Button, Group, Table, Title } from "@mantine/core";
import { MenuLateral } from "../components/MenuLateral";
import { useEffect, useState } from "react";
import type { Consulta } from "@clinica/shared/consulta";
import { listarConsultas } from "../services/api";
import { NovaConsultaModal } from "../components/NovaConsultaModal";
import { PacientesPage } from "./PacientesPage";

type Props = {
  nome: string;
  onSair: () => void;
};

export function HomePage({ nome, onSair }: Props) {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [erro, setErro] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  // Qual tela aparece no meio: "consultas" ou "pacientes"
  const [pagina, setPagina] = useState("consultas");

  async function buscarConsultas() {
    setErro("");
    try {
      setConsultas(await listarConsultas());
    } catch {
      setErro("Não foi possível buscar as consultas na API");
    }
  }

  useEffect(() => {
    buscarConsultas();
  }, []); //executa uma única vez (ao construir este comp) a função buscarConsultas()

  return (
    <MenuLateral nome={nome} onSair={onSair}>
      <Group mb="lg">
        <Button
          variant={pagina === "consultas" ? "filled" : "default"}
          onClick={() => setPagina("consultas")}
        >
          Consultas
        </Button>
        <Button
          variant={pagina === "pacientes" ? "filled" : "default"}
          onClick={() => setPagina("pacientes")}
        >
          Pacientes
        </Button>
      </Group>

      {pagina === "pacientes" && <PacientesPage />}

      {pagina === "consultas" && (
        <>
          <Group justify="space-between" align="end" mb="xl">
            <Title order={1}>Consultas</Title>
            <Button onClick={() => setModalAberto(true)}>Nova consulta</Button>
          </Group>
          {erro && (
            <Alert color="red" mb="md">
              {erro}
            </Alert>
          )}
          <Table.ScrollContainer minWidth={560}>
            <Table bg="white" highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Data</Table.Th>
                  <Table.Th>Turno</Table.Th>
                  <Table.Th>Paciente</Table.Th>
                  <Table.Th>Médico</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {consultas.map((consulta) => (
                  <Table.Tr key={consulta.id}>
                    <Table.Td>{consulta.data}</Table.Td>
                    <Table.Td>
                      {consulta.turno === "M" ? "Manhã" : "Tarde"}
                    </Table.Td>
                    <Table.Td>{consulta.paciente.nome}</Table.Td>
                    <Table.Td>{consulta.medico.nome}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
          <NovaConsultaModal
            aberto={modalAberto}
            onFechar={() => setModalAberto(false)}
            onSalvo={buscarConsultas}
          />
        </>
      )}
    </MenuLateral>
  );
}
