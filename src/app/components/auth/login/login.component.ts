import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../../services/usuario.service';
import { GoogleAuthService } from '../../../services/google-auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  
  email: string = '';
  password: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  
  constructor(
    private router: Router,
    private usuarioService: UsuarioService,
    private googleAuthService: GoogleAuthService
  ) {}

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  volverATurnos(): void {
    this.router.navigate(['/turnos']);
  }

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please complete all fields';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Probar la conexión con el backend
    this.usuarioService.login({ email: this.email, password: this.password })
      .subscribe({
        next: (response) => {
          this.successMessage = 'Login successful! Redirecting to home page...';
          this.isLoading = false;
          
          // Guardar el token y email en localStorage
          if (response.accessToken) {
            localStorage.setItem('token', response.accessToken);
            localStorage.setItem('userEmail', this.email); // Guardar el email del usuario
            if (response.refreshToken) {
              localStorage.setItem('refreshToken', response.refreshToken);
            }
          }
          
          // Redirigir a la pantalla de turnos después de 1.5 segundos
          setTimeout(() => {
            this.router.navigate(['/turnos']);
          }, 1500);
        },
        error: (error) => {
          console.error('❌ Error en la conexión:', error);
          
          // Mostrar mensaje amigable según el tipo de error
          if (error.status === 401) {
            this.errorMessage = 'The provided data is not correct';
          } else if (error.status === 0) {
            this.errorMessage = 'Connection error. Please check your internet connection';
          } else {
            this.errorMessage = `Connection error: ${error.status} - ${error.message || 'Unknown error'}`;
          }
          
          this.isLoading = false;
        }
      });
  }

  googleSignIn(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = 'Redirecting to Google...';
    
    // Iniciar el flujo de autenticación de Google
    this.googleAuthService.initiateGoogleAuth();
  }
}
