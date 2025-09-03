import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../../services/usuario.service';

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
    private usuarioService: UsuarioService
  ) {}

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor completa todos los campos';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Probar la conexión con el backend
    this.usuarioService.login({ email: this.email, password: this.password })
      .subscribe({
        next: (response) => {
          console.log('✅ Conexión exitosa:', response);
          this.successMessage = '¡Login exitoso! Redirigiendo a turnos...';
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
          this.errorMessage = `Error de conexión: ${error.status} - ${error.message || 'Error desconocido'}`;
          this.isLoading = false;
        }
      });
  }
}
