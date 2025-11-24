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

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  onSubmit(): void {
    if (!this.firstName || !this.lastName || !this.email || !this.password || !this.confirmPassword) {
      this.errorMessage = 'Please complete all fields';
      return;
    }

    if (!this.isValidEmail(this.email)) {
      this.errorMessage = 'Please enter a valid email address';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
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
          this.successMessage = 'User registered successfully! Redirecting to login...';
          this.isLoading = false;
          
          // Redirigir al login después de 2 segundos
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (error) => {
          console.error('❌ Error en el registro:', error);
          
          // Mostrar mensaje amigable según el tipo de error
          if (error.status === 400) {
            this.errorMessage = 'The email is already registered';
          } else if (error.status === 0) {
            this.errorMessage = 'Connection error. Please check your internet connection';
          } else {
            this.errorMessage = `Registration error: ${error.status} - ${error.message || 'Unknown error'}`;
          }
          
          this.isLoading = false;
        }
      });
  }
}
