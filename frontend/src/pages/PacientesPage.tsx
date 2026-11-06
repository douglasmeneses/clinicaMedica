import { useEffect, useState } from "react";
import { Alert, Table, Title } from "@mantine/core";
import type { Paciente } from "@clinica/shared/paciente";
import { listarPacientes } from "../services/api.ts";

export function PacientesPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [erro, setErro] = useState("");

  async function buscarPacientes() {
    setErro("");
    try {
      setPacientes(await listarPacientes());
    } catch {
      setErro("Não foi possível buscar os pacientes na API");
    }
  }

  useEffect(() => {
    buscarPacientes();
  }, []); // executa uma única vez, quando a tela aparece

  return (
    <>
      <Title order={1} mb="xl">
        Pacientes
      </Title>
      {erro && (
        <Alert color="red" mb="md">
          {erro}
        </Alert>
      )}
      <Table.ScrollContainer minWidth={560}>
        <Table bg="white" highlightOnHover verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nome</Table.Th>
              <Table.Th>CPF</Table.Th>
              <Table.Th>Telefone</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {pacientes.map((paciente) => (
              <Table.Tr key={paciente.id}>
                <Table.Td>{paciente.nome}</Table.Td>
                <Table.Td>{paciente.cpf}</Table.Td>
                <Table.Td>{paciente.telefone}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </>
  );
}
