export interface TurnoForm {
	id: number | null;
	cancha: {
		id: number;
		nombre: string;
	} | null;
	cliente: {
		nombre: string;
		apellido: string;
		correo: string;
	} | null;
	fechaInicio: Date | null;
	fechaFin: Date | null;
}