
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ITurnoDisponibleResponse } from "../interfaces/ITurnoDisponible";

@Injectable({
  providedIn: 'root'
})
export class TurnoService {
  private baseUrl = 'http://localhost:8080/api/v1/turnos';

  constructor(private http: HttpClient) {}

  getTurnos(): Observable<any> {
    return this.http.get(this.baseUrl);
  }

  getTurnoById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  crearTurno(turno: any): Observable<any> {
    return this.http.post(this.baseUrl, turno);
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
