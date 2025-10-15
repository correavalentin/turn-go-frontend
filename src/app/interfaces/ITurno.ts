import ICliente from './ICliente.ts'
import IHorario from './IHorario.ts'

export interface ITurno {
  id: number,
  fechaInicio: Date,
  estado: string,
  cliente: null || ICliente
  horario: IHorario
}
