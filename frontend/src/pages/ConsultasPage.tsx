import { useEffect, useState } from "react";
import {
  ActionIcon,
  Alert,
  Button,
  Group,
  Table,
  TextInput,
  Title,
} from "@mantine/core";
import { IconPencil, IconTrash } from "@tabler/icons-react";
import type { Consulta } from "@clinica/shared/consulta";
import { listarConsultas, removerConsulta } from "../services/api.ts";
import { ConsultaModal } from "../components/ConsultaModal.tsx";

export function ConsultasPage() {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [erro, setErro] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  // Qual consulta está sendo editada (null = nova consulta)
  const [emEdicao, setEmEdicao] = useState<Consulta | null>(null);
  // O que foi digitado na busca
  const [busca, setBusca] = useState("");

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
  }, []); // executa uma única vez, quando a tela aparece

  function abrirNova() {
    setEmEdicao(null); //não estou editando uma consulta mas criando do zero
    setModalAberto(true);
  }

  function abrirEdicao(consulta: Consulta) {
    setEmEdicao(consulta); //consulta já existe, então vamos editar
    setModalAberto(true);
  }

  async function remover(consulta: Consulta) {
    // confirm() é do navegador: mostra a pergunta com OK e Cancelar
    const pergunta = `Remover a consulta de ${consulta.paciente.nome} em ${consulta.data}?`;
    if (!confirm(pergunta)) return;
    try {
      await removerConsulta(consulta.id);
      await buscarConsultas();
    } catch {
      setErro("Não foi possível remover a consulta");
    }
  }

  // Não é um estado novo: é calculado a cada desenho, a partir da lista e da busca
  const visiveis: Consulta[] = consultas.filter(
    (consulta) =>
      consulta.paciente.nome.toLowerCase().includes(busca.toLowerCase()) ||
      consulta.medico.nome.toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <>
      <Group justify="space-between" align="end" mb="xl">
        <Title order={1}>Consultas</Title>
        <Button onClick={abrirNova}>Nova consulta</Button>
      </Group>
      {erro && (
        <Alert color="red" mb="md">
          {erro}
        </Alert>
      )}
      <TextInput
        label="Buscar"
        placeholder="Nome do paciente ou do médico"
        value={busca}
        onChange={(evento) => setBusca(evento.target.value)}
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
            {visiveis.map((consulta) => (
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
                      onClick={() => abrirEdicao(consulta)}
                    >
                      <IconPencil size={18} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      aria-label="Remover"
                      onClick={() => remover(consulta)}
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
        consulta={emEdicao}
        onFechar={() => setModalAberto(false)}
        onSalvo={buscarConsultas}
      />
    </>
  );
}
