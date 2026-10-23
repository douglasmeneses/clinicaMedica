import { useEffect, useState } from "react";
import { Alert, Loader, Table, Title } from "@mantine/core";
import { listarPacientes } from "../services/api.ts";
import type { Paciente } from "../types/paciente.ts";

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    listarPacientes()
      .then(setPacientes)
      .catch((e: Error) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, []);

  if (carregando) return <Loader />;
  if (erro) return <Alert color="red" title="Ops!">{erro}</Alert>;

  return (
    <>
      <Title order={2} mb="md">
        Pacientes
      </Title>
      <Table striped highlightOnHover withTableBorder>
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
    </>
  );
}
