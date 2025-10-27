export interface IHorarioDisponible {
  horarioId: number | string;
  horaInicio: string;
  horaFin: string;
}

export interface ITurnoDisponibleResponse {
  canchaId: number | string;
  numeroCancha: string;
  horarios: IHorarioDisponible[];
}
