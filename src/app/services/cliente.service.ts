import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ICliente } from '../interfaces/ICliente';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private baseUrl = 'http://localhost:8080/api/v1/clientes'; 
  
  constructor(private http: HttpClient) {}

  getClientes(): Observable<any> {
    return this.http.get(this.baseUrl);
  }

  getClienteById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  getClienteByEmail(email: string): Observable<ICliente[] | null> {
    return this.http.get<ICliente[] | null>(`${this.baseUrl}?email=${email}`);
  }

  crearCliente(cliente: any): Observable<ICliente> {
    return this.http.post<ICliente>(this.baseUrl, cliente);
  }

  actualizarCliente(id: number, cliente: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, cliente);
  }

  eliminarCliente(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  findOrCreateCliente(clienteData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/find-or-create`, clienteData);
  }

  asignarUserId(cliente: number, userId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/${cliente}/assign-user-id`, { userId }, {
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
