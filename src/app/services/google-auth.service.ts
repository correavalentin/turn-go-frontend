import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {
  private baseUrl = 'http://localhost:3001';

  constructor(private http: HttpClient) {}

  // Iniciar el flujo de autenticación de Google
  initiateGoogleAuth(): void {
    window.location.href = `${this.baseUrl}/auth/google`;
  }

  // Verificar el token de Google (opcional, para verificación adicional)
  verifyGoogleToken(token: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/google/verify`, { token });
  }

  // Procesar la respuesta del callback de Google
  processGoogleCallback(queryParams: any): any {
    const accessToken = queryParams.get('accessToken');
    const refreshToken = queryParams.get('refreshToken');
    const email = queryParams.get('email');

    if (accessToken && refreshToken && email) {
      // Guardar en localStorage
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userEmail', email);
      
      return {
        success: true,
        accessToken,
        refreshToken,
        email
      };
    }

    return { success: false };
  }
}

