import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Turno } from './turno.model';

@Component({
  selector: 'app-turnos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './turnos.component.html',
  styleUrl: './turnos.component.css'
})
export class TurnosComponent {

  turnos: Turno[] = [
    { 
      id: 1, 
      fechaInicio: new Date('2024-01-15T10:00:00'), 
      fechaFin: new Date('2024-01-15T11:00:00') 
    },
    { 
      id: 2, 
      fechaInicio: new Date('2024-01-15T14:00:00'), 
      fechaFin: new Date('2024-01-15T15:00:00') 
    },
    { 
      id: 3, 
      fechaInicio: new Date('2024-01-15T16:00:00'), 
      fechaFin: new Date('2024-01-15T17:00:00') 
    }
  ];

  editarTurno(turno: Turno) {
    // Lógica para editar el turno
    console.log('Editando turno:', turno);
  }

  eliminarTurno(id: number) {
    // Lógica para eliminar el turno
    console.log('Eliminando turno con id:', id);
  }
}
