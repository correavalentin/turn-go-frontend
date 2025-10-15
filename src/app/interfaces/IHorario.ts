import { ICancha } from './ICancha'

export interface IHorario {
  id: number,
  cancha: ICancha,
  horaInicio: string,
  horaFin: string
}
