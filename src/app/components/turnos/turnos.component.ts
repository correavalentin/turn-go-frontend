import { Component, OnInit } from '@angular/core';
import { Turno } from './turno.model';
import { TurnoService } from '../../services/turno.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-turnos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './turnos.component.html',
  styleUrls: ['./turnos.component.css']
})
export class TurnosComponent implements OnInit {
  turnos: Turno[] = [];
  isAuthenticated: boolean = false;
  userEmail: string = '';

  constructor(
    private turnoService: TurnoService,
    private router: Router
  ) {}

  ngOnInit() {
    this.verificarAutenticacion();
    this.cargarTurnos();
  }

  verificarAutenticacion() {
    const token = localStorage.getItem('token');
    if (token) {
      this.isAuthenticated = true;
      // Aquí podrías decodificar el JWT para obtener el email del usuario
      // Por ahora, lo obtenemos del localStorage si lo guardaste
      this.userEmail = localStorage.getItem('userEmail') || 'Usuario';
    }
  }

  cargarTurnos() {
    this.turnoService.getTurnos().subscribe(data => {
      this.turnos = data;
    });
  }

  editarTurno(turno: Turno) {
    // Lógica para editar
  }

  eliminarTurno(id: number) {
    this.turnoService.eliminarTurno(id).subscribe(() => {
      this.turnos = this.turnos.filter(t => t.id !== id);
    });
  }

  irALogin() {
    this.router.navigate(['/login']);
  }

  irARegister() {
    this.router.navigate(['/register']);
  }

  cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userEmail');
    this.isAuthenticated = false;
    this.userEmail = '';
    // No redirigir, quedarse en /turnos
  }
}
