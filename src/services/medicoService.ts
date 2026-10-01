export async function listarMedicos(): Medico[] {}
export async function encontrarUmMedico(id: number): Medico {}
export async function criarMedico(dados: MedicoDTO): Medico {}
export async function atualizarMedico(
  id: number,
  dados: MedicoDTO,
): Medico {}
export async function deletarMedico(id: number): void {}
