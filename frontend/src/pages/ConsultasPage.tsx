import {
  ActionIcon,
  Alert,
  Button,
  Group,
  Table,
  TextInput,
  Title,
} from "@mantine/core";
import { useEffect, useState } from "react";
import type { Consulta } from "@clinica/shared/consulta";
import { deletarConsulta, listarConsultas } from "../services/api";
import { ConsultaModal } from "../components/ConsultaModal";
import { IconPencil, IconTrash } from "@tabler/icons-react";

export function ConsultasPage() {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [erro, setErro] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [consultaEmEdicao, setConsultaEmEdicao] = useState<Consulta | null>(
    null,
  );
  const [busca, setBusca] = useState<string>("");

  function abrirNovaConsulta() {
    setConsultaEmEdicao(null);
    setModalAberto(true);
  }

  function abrirEdicaoConsulta(consulta: Consulta) {
    setConsultaEmEdicao(consulta);
    setModalAberto(true);
  }

  async function removerConsulta(consulta: Consulta) {
    const textoConfirmacao = "Tem certeza que quer remover esta consulta?";
    if (!confirm(textoConfirmacao)) return;
    try {
      await deletarConsulta(consulta.id); //9
      await buscarConsultas(); //9
    } catch {
      setErro("Não foi possível remover a consulta");
    }
  }

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

  const consultasVisiveis: Consulta[] = consultas.filter(
    (consulta) =>
      consulta.paciente.nome.toLowerCase().includes(busca.toLowerCase()) ||
      consulta.medico.nome.toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <>
      <Group justify="space-between" align="end" mb="xl">
        <Title order={1}>Consultas</Title>
        <Button onClick={() => abrirNovaConsulta()}>Nova consulta</Button>
      </Group>
      {erro && (
        <Alert color="red" mb="md">
          {erro}
        </Alert>
      )}

      <TextInput
        label="Buscar consulta"
        placeholder="Nome do paciente ou médico"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        mb="md"
        maw={360}
      />
      <Table.ScrollContainer minWidth={560}>
        <Table bg="white" highlightOnHover verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Data</Table.Th>
              <Table.Th>Turno</Table.Th>
              <Table.Th>Paciente</Table.Th>
              <Table.Th>Médico</Table.Th>
              <Table.Th></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {consultasVisiveis.map((consulta) => (
              <Table.Tr key={consulta.id}>
                <Table.Td>{consulta.data}</Table.Td>
                <Table.Td>
                  {consulta.turno === "M" ? "Manhã" : "Tarde"}
                </Table.Td>
                <Table.Td>{consulta.paciente.nome}</Table.Td>
                <Table.Td>{consulta.medico.nome}</Table.Td>
                <Table.Td>
                  <Group gap={4} justify="flex-end" wrap="nowrap">
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      aria-label="Editar"
                      onClick={() => abrirEdicaoConsulta(consulta)}
                    >
                      <IconPencil size={18} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      aria-label="Remover"
                      onClick={() => removerConsulta(consulta)}
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
      <ConsultaModal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        onSalvo={buscarConsultas}
        consulta={consultaEmEdicao}
      />
    </>
  );
}
