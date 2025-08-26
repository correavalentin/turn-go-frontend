import { Component } from '@angular/core';
import { Turno } from './turno.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-turnos',
  imports: [CommonModule],
  templateUrl: './turnos.component.html',
  styleUrl: './turnos.component.css'
})
export class TurnosComponent {

  // Mocks de turnos. TODO: Conectar a API de Spring.
  turnos: Turno[] = [
    { id: 1, fechaInicio: new Date(), cliente: { nombre: 'Juan', apellido: 'Pérez', correo: 'juan.perez@example.com' }, cancha: { id: 1, numero: 1 }, fechaFin: new Date() },
    { id: 2, fechaInicio: new Date(), cliente: { nombre: 'María', apellido: 'Gómez', correo: 'maria.gomez@example.com' }, cancha: { id: 2, numero: 2 }, fechaFin: new Date() },
    { id: 3, fechaInicio: new Date(), cliente: { nombre: 'Pedro', apellido: 'López', correo: 'pedro.lopez@example.com' }, cancha: { id: 3, numero: 3 }, fechaFin: new Date() }
  ];
  
  editarTurno(turno: Turno) {
    // Lógica para editar el turno
  }

  eliminarTurno(id: number) {
    // Lógica para eliminar el turno
  }

  agregarTurno() {
    // Lógica para agregar un nuevo turno
  }
}
