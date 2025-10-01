import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GoogleAuthService } from '../../../services/google-auth.service';

@Component({
  selector: 'app-google-callback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './google-callback.component.html',
  styleUrls: ['./google-callback.component.css']
})
export class GoogleCallbackComponent implements OnInit {
  isLoading = true;
  errorMessage = '';
  successMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private googleAuthService: GoogleAuthService
  ) {}

  ngOnInit() {
    this.processGoogleCallback();
  }

  private processGoogleCallback() {
    // Obtener los parámetros de la URL
    this.route.queryParams.subscribe(params => {
      console.log('Parámetros recibidos:', params);
      
      const result = this.googleAuthService.processGoogleCallback(params);
      
      if (result.success) {
        this.successMessage = `¡Bienvenido ${result.email}! Redirigiendo a turnos...`;
        this.isLoading = false;
        
        // Redirigir a turnos después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/turnos']);
        }, 2000);
      } else {
        this.errorMessage = result.message || 'Error en la autenticación con Google. Intenta nuevamente.';
        this.isLoading = false;
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToTurnos() {
    this.router.navigate(['/turnos']);
  }
}
