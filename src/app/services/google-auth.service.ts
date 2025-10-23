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
    
    const accessToken = queryParams['accessToken'];
    const refreshToken = queryParams['refreshToken'];
    const email = queryParams['email'];
    const error = queryParams['error'];

    // Si hay un error en los parámetros
    if (error) {
      console.error('Error en callback de Google:', error);
      return { 
        success: false, 
        error: error,
        message: 'Error en la autenticación con Google'
      };
    }

    // Verificar que tenemos todos los tokens necesarios
    if (accessToken && email) {
      // Guardar en localStorage
      localStorage.setItem('token', accessToken);
      localStorage.setItem('userEmail', email);
      
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      
      return {
        success: true,
        accessToken,
        refreshToken,
        email
      };
    }

    console.error('❌ Faltan parámetros en el callback de Google');
    return { 
      success: false, 
      error: 'missing_params',
      message: 'Faltan parámetros de autenticación'
    };
  }
}

