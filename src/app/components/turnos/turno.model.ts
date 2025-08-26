export interface Turno {
    id: number;
    cliente: {
        nombre: string;
        apellido: string;
        correo: string;
    };
    cancha: {
        id: number;
        numero: number;
    };
    fechaInicio: Date;
    fechaFin: Date;
}