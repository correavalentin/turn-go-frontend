import ICancha from './ICancha.ts'

export interface IHorario {
  id: number,
  cancha: ICancha,
  horaInicio: string,
  horaFin: string
}
