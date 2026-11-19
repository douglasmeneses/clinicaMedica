import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Group,
  Modal,
  NativeSelect,
  Stack,
  TextInput,
} from "@mantine/core";
import axios from "axios";
import type { ConsultaInput } from "@clinica/shared/consulta";
import type { Medico } from "@clinica/shared/medico";
import type { Paciente } from "@clinica/shared/paciente";
import {
  cadastrarConsulta,
  listarMedicos,
  listarPacientes,
} from "../services/api.ts";

type Props = {
  aberto: boolean;
  onFechar: () => void;
  onSalvo: () => void;
};

export function NovaConsultaModal({ aberto, onFechar, onSalvo }: Props) {
  // As listas dos selects, que vêm da API
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);

  // O que a pessoa escolheu/digitou
  const [pacienteId, setPacienteId] = useState("");
  const [medicoId, setMedicoId] = useState("");
  const [data, setData] = useState("");
  const [turno, setTurno] = useState<ConsultaInput["turno"]>("M");

  const [erro, setErro] = useState("");
  const [errosDosCampos, setErrosDosCampos] = useState<Record<string, string>>(
    {},
  );
  const [carregando, setCarregando] = useState(false);

  async function buscarListas() {
    try {
      setPacientes(await listarPacientes());
      setMedicos(await listarMedicos());
    } catch {
      setErro("Não foi possível buscar pacientes e médicos na API");
    }
  }

  // Busca pacientes e médicos uma vez, quando a Home aparece
  useEffect(() => {
    buscarListas();
  }, []);

  function fechar() {
    // Limpa tudo para a próxima vez que o modal abrir
    setPacienteId("");
    setMedicoId("");
    setData("");
    setTurno("M");
    setErro("");
    setErrosDosCampos({});
    onFechar();
  }

  async function salvar() {
    setErro("");
    setErrosDosCampos({});
    setCarregando(true);
    try {
      // O select guarda o id como texto ("3"); a API quer número (3)
      await cadastrarConsulta({
        data,
        turno,
        medicoId: Number(medicoId),
        pacienteId: Number(pacienteId),
      });
      onSalvo();
      fechar();
    } catch (e) {
      if (axios.isAxiosError(e) && e.response) {
        const dados = e.response.data;
        setErro(dados.mensagem);
        // Erro de cada campo: { pacienteId: "...", data: "..." }
        const porCampo: Record<string, string> = {};
        if (dados.detalhes) {
          for (const detalhe of dados.detalhes)
            porCampo[detalhe.campo] = detalhe.mensagem;
        }
        setErrosDosCampos(porCampo);
      } else {
        setErro("Não foi possível conectar à API. Ela está rodando?");
      }
    }
    setCarregando(false);
  }

  return (
    <Modal opened={aberto} onClose={fechar} title="Nova consulta" centered>
      <form
        onSubmit={(evento) => {
          evento.preventDefault();
          salvar();
        }}
      >
        <Stack>
          {erro && <Alert color="red">{erro}</Alert>}
          <NativeSelect
            label="Paciente"
            value={pacienteId}
            onChange={(evento) => setPacienteId(evento.target.value)}
            error={errosDosCampos.pacienteId}
            data={[
              { value: "", label: "Selecione o paciente" },
              ...pacientes.map((paciente) => ({
                value: String(paciente.id),
                label: paciente.nome,
              })),
            ]}
          />
          <NativeSelect
            label="Médico"
            value={medicoId}
            onChange={(evento) => setMedicoId(evento.target.value)}
            error={errosDosCampos.medicoId}
            data={[
              { value: "", label: "Selecione o médico" },
              ...medicos.map((medico) => ({
                value: String(medico.id),
                label: `${medico.nome} (${medico.especialidade})`,
              })),
            ]}
          />
          <TextInput
            label="Data"
            placeholder="DD/MM/AAAA"
            value={data}
            onChange={(evento) => setData(evento.target.value)}
            error={errosDosCampos.data}
          />
          <NativeSelect
            label="Turno"
            value={turno}
            onChange={(evento) =>
              setTurno(evento.target.value as ConsultaInput["turno"])
            }
            data={[
              { value: "M", label: "Manhã" },
              { value: "T", label: "Tarde" },
            ]}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={fechar}>
              Cancelar
            </Button>
            <Button type="submit" loading={carregando}>
              Salvar
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
