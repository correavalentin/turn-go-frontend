import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ITurnoDisponibleResponse } from "../interfaces/ITurnoDisponible";
import { ITurno, ITurnoWithoutId } from "../interfaces/ITurno";

@Injectable({
  providedIn: 'root'
})
export class TurnoService {
  private baseUrl = 'http://localhost:8080/api/v1/turnos';

  constructor(private http: HttpClient) {}

  getTurnos(): Observable<ITurno[]> {
    return this.http.get<ITurno[]>(this.baseUrl);
  }

  getTurnoById(id: number): Observable<ITurno> {
    return this.http.get<ITurno>(`${this.baseUrl}/${id}`);
  }

  crearTurno(turno: ITurnoWithoutId): Observable<ITurno> {
    return this.http.post<ITurno>(this.baseUrl, turno);
  }

  eliminarTurno(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  getDisponibles(date: Date) : Observable<ITurnoDisponibleResponse[]> {
    // Formatear la fecha como ISO string para el backend
    const fechaFormateada = date.toISOString().split('T')[0]; // YYYY-MM-DD
    return this.http.get<ITurnoDisponibleResponse[]>(`${this.baseUrl}/disponibles?fecha=${fechaFormateada}`)
  }
}
