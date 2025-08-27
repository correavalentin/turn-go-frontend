import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CanchaService {
  private baseUrl = 'http://localhost:8080/api/canchas';

  constructor(private http: HttpClient) {}

  getCanchas(): Observable<any> {
    return this.http.get(this.baseUrl);
  }

  getCancha(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  crearCancha(cancha: any): Observable<any> {
    return this.http.post(this.baseUrl, cancha);
  }

  actualizarCancha(id: number, cancha: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, cancha);
  }

  eliminarCancha(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
