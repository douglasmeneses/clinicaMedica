import { prisma } from "../src/config/prisma.js";

// Médicos que já vêm no banco: a clínica não tem tela de cadastro de médico.
// upsert pelo CRM: rodar o seed de novo não duplica ninguém.
const medicosData = [
  { nome: "Dr. Carlos Eduardo", crm: "CRM-SP-123456", especialidade: "Cardiologia" },
  { nome: "Dra. Fernanda Lima", crm: "CRM-PB-10234", especialidade: "Clínica Geral" },
  { nome: "Dr. Rafael Moura", crm: "CRM-PB-11872", especialidade: "Dermatologia" },
  { nome: "Dra. Juliana Rocha", crm: "CRM-PB-12550", especialidade: "Pediatria" },
  { nome: "Dr. Marcelo Tavares", crm: "CRM-PB-13019", especialidade: "Ortopedia" },
  { nome: "Dra. Patrícia Nunes", crm: "CRM-PB-14406", especialidade: "Ginecologia" },
];

const pacientesData = [
  { nome: "Ana Beatriz Costa", cpf: "11122233344", telefone: "83991112233" },
  { nome: "Bruno Henrique Alves", cpf: "22233344455", telefone: "83992223344" },
  { nome: "Camila Ferreira Souza", cpf: "33344455566", telefone: "83993334455" },
  { nome: "Diego Martins Pereira", cpf: "44455566677", telefone: "83994445566" },
  { nome: "Eduarda Silva Gomes", cpf: "55566677788", telefone: "83995556677" },
  { nome: "Felipe Nogueira Ramos", cpf: "66677788899", telefone: "83996667788" },
  { nome: "Gabriela Duarte Melo", cpf: "77788899900", telefone: "83997778899" },
  { nome: "Henrique Castro Dias", cpf: "88899900011", telefone: "83998889900" },
];

const medicosPorCrm = new Map<string, number>();
for (const medico of medicosData) {
  const salvo = await prisma.medico.upsert({
    where: { crm: medico.crm },
    update: { nome: medico.nome, especialidade: medico.especialidade },
    create: medico,
  });
  medicosPorCrm.set(salvo.crm, salvo.id);
}

const pacientesPorCpf = new Map<string, number>();
for (const paciente of pacientesData) {
  const salvo = await prisma.paciente.upsert({
    where: { cpf: paciente.cpf },
    update: { nome: paciente.nome, telefone: paciente.telefone },
    create: paciente,
  });
  pacientesPorCpf.set(salvo.cpf, salvo.id);
}

const consultasData = [
  { data: "19/11/2026", turno: "M", crm: "CRM-SP-123456", cpf: "11122233344" },
  { data: "19/11/2026", turno: "M", crm: "CRM-SP-123456", cpf: "22233344455" },
  { data: "19/11/2026", turno: "M", crm: "CRM-PB-10234", cpf: "33344455566" },
  { data: "19/11/2026", turno: "T", crm: "CRM-PB-11872", cpf: "44455566677" },
  { data: "19/11/2026", turno: "T", crm: "CRM-PB-12550", cpf: "55566677788" },
  { data: "20/11/2026", turno: "M", crm: "CRM-PB-13019", cpf: "66677788899" },
  { data: "20/11/2026", turno: "M", crm: "CRM-PB-14406", cpf: "77788899900" },
  { data: "20/11/2026", turno: "T", crm: "CRM-SP-123456", cpf: "88899900011" },
  { data: "20/11/2026", turno: "T", crm: "CRM-PB-10234", cpf: "11122233344" },
  { data: "21/11/2026", turno: "M", crm: "CRM-PB-11872", cpf: "22233344455" },
  { data: "21/11/2026", turno: "T", crm: "CRM-PB-13019", cpf: "33344455566" },
  { data: "23/11/2026", turno: "M", crm: "CRM-PB-12550", cpf: "44455566677" },
];

let consultasCriadas = 0;
for (const consulta of consultasData) {
  const medicoId = medicosPorCrm.get(consulta.crm)!;
  const pacienteId = pacientesPorCpf.get(consulta.cpf)!;

  const existente = await prisma.consulta.findFirst({
    where: {
      data: consulta.data,
      turno: consulta.turno,
      medicoId,
      pacienteId,
    },
  });

  if (!existente) {
    await prisma.consulta.create({
      data: {
        data: consulta.data,
        turno: consulta.turno,
        medicoId,
        pacienteId,
      },
    });
    consultasCriadas++;
  }
}

console.log(
  `Seed concluído: ${medicosData.length} médicos, ${pacientesData.length} pacientes e ${consultasData.length} consultas (${consultasCriadas} novas).`,
);
await prisma.$disconnect();
