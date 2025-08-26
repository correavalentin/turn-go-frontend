import { Component } from '@angular/core';
import { Turno } from '../turno.model';

@Component({
  selector: 'app-turnos',
  imports: [],
  templateUrl: './turnos.component.html',
  styleUrl: './turnos.component.css'
})
export class TurnosComponent {


  turnos = [
    { id: 1, nombre: 'Turno 1', fecha: new Date() },
    { id: 2, nombre: 'Turno 2', fecha: new Date() },
    { id: 3, nombre: 'Turno 3', fecha: new Date() }
  ];

  editarTurno(turno: Turno) {
    // Lógica para editar el turno
  }

  eliminarTurno(id: number) {
    // Lógica para eliminar el turno
  }
}
