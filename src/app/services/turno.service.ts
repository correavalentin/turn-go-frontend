
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
}
