import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ICancha } from '../interfaces/ICancha'

@Injectable({
  providedIn: 'root'
})
export class CanchaService {
  private baseUrl = 'http://localhost:8080/api/canchas';

  constructor(private http: HttpClient) {}

  getCanchas(): Observable<ICancha> {
    return this.http.get<ICancha>(this.baseUrl);
  }

  getCancha(id: number): Observable<ICancha> {
    return this.http.get<ICancha>(`${this.baseUrl}/${id}`);
  }

  // crearCancha(cancha: ICancha): Observable<ICancha> {
  //   return this.http.post(this.baseUrl, cancha);
  // }

  // actualizarCancha(id: number, cancha: ICancha): Observable<ICancha> {
  //   return this.http.put(`${this.baseUrl}/${id}`, cancha);
  // }

  // eliminarCancha(id: number): Observable<ICancha> {
  //   return this.http.delete(`${this.baseUrl}/${id}`);
  // }
}
