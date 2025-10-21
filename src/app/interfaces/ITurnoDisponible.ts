export interface IHorarioDisponible {
  horarioId: number;
  horaInicio: string;
  horaFin: string;
}

export interface ITurnoDisponibleResponse {
  canchaId: number;
  numeroCancha: string;
  horarios: IHorarioDisponible[];
}
