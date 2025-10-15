import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

  getDisponibles(date: Date) : Observable<ITurno[]> {
    return this.http.get<ITurno[]>(`${this.baseUrl}/disponibles?fecha=${date}`)
  }
}
