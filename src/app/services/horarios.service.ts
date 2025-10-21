import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IHorario } from '../interfaces/IHorario';

@Injectable({
  providedIn: 'root'
})
export class HorariosService {
  private baseUrl = 'http://localhost:8080/api/v1/horarios';

  constructor(private http: HttpClient) {}

  getHorarios(): Observable<IHorario[]> {
    return this.http.get<IHorario[]>(this.baseUrl);
  }

  getHorarioById(id: number): Observable<IHorario> {
    return this.http.get<IHorario>(`${this.baseUrl}/${id}`);
  }
}
