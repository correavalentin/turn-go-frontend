import { ICliente } from './ICliente'
import { IHorario } from './IHorario'

export interface ITurno {
  id: number,
  fechaInicio: Date,
  estado: string,
  cliente: null | ICliente
  horario: IHorario
}
