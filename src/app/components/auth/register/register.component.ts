import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../../services/usuario.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  
  firstName: string = '';
  lastName: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  
  constructor(
    private router: Router,
    private usuarioService: UsuarioService
  ) {}

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  volverATurnos(): void {
    this.router.navigate(['/turnos']);
  }

  onSubmit(): void {
    if (!this.firstName || !this.lastName || !this.email || !this.password || !this.confirmPassword) {
      this.errorMessage = 'Por favor completa todos los campos';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Crear objeto de usuario para el registro
    const userData = {
      email: this.email,
      password: this.password,
      firstName: this.firstName,
      lastName: this.lastName
    };

    // Registrar usuario usando el servicio
    this.usuarioService.register(userData)
      .subscribe({
        next: (response) => {
          console.log('✅ Usuario registrado exitosamente:', response);
          this.successMessage = '¡Usuario registrado exitosamente! Redirigiendo al login...';
          this.isLoading = false;
          
          // Redirigir al login después de 2 segundos
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (error) => {
          console.error('❌ Error en el registro:', error);
          this.errorMessage = `Error en el registro: ${error.status} - ${error.message || 'Error desconocido'}`;
          this.isLoading = false;
        }
      });
  }
}
