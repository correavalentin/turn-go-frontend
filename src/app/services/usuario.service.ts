import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private baseUrl = 'http://localhost:3001'; // users-api corre en puerto 3001
  
  constructor(private http: HttpClient) {}

  // Métodos específicos para autenticación - ESTOS SÍ EXISTEN
  login(credenciales: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, credenciales);
  }

  register(usuario: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, usuario);
  }

  // Método para obtener el usuario actual - ESTE SÍ EXISTE
  getUsuarioActual(): Observable<any> {
    return this.http.get(`${this.baseUrl}/me`);
  }
}
