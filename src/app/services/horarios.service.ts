import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IHorario } from '../interfaces/IHorario'

@Injectable({
  providedIn: 'root'
})
export class HorariosService {
  private baseUrl = 'http://localhost:8080/api/v1/horarios';

  constructor(private http: HttpClient) {}

  getHorarios() : Observable<IHorario[]> {
    return this.http.get<IHorario[]>(this.baseUrl);
  }
}
