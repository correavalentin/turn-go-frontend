import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  
  constructor(private router: Router) {}

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  onSubmit(): void {
    // Aquí irá la lógica de login cuando conectemos con el backend
    console.log('Login submitted', { email: this.email, password: this.password });
  }
}
