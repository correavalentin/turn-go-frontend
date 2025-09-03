import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private baseUrl = 'http://localhost:3001'; // users-api corre en puerto 3001
  
  constructor(private http: HttpClient) {}

  getUsuarios(): Observable<any> {
    return this.http.get(`${this.baseUrl}/users`); // Endpoint que necesitamos crear
  }

  getUsuarioById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/users/${id}`); // Endpoint que necesitamos crear
  }

  crearUsuario(usuario: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/users`, usuario); // Endpoint que necesitamos crear
  }

  eliminarUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/users/${id}`); // Endpoint que necesitamos crear
  }

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
