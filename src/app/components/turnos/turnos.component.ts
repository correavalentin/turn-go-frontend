import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Turno } from './turno.model';
import { CommonModule } from '@angular/common';
import { Dialog } from '@angular/cdk/dialog';
import { ModalTurnosComponent } from './modal-turnos/modal-turnos.component';

@Component({
  selector: 'app-turnos',
  imports: [CommonModule],
  templateUrl: './turnos.component.html',
  styleUrl: './turnos.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TurnosComponent {

  private dialog = inject(Dialog);
  protected openModal(turno?: Turno) {
    this.dialog.open(ModalTurnosComponent, {
      data: turno ?? null,
      width: '90%',        // ocupa casi todo el ancho de la pantalla
      maxWidth: '1200px',  // limita el ancho máximo para pantallas grandes
      height: '80%',       // ocupa gran parte de la altura
      maxHeight: '90vh',   // limita altura máxima al 90% de la ventana
      panelClass: 'custom-modal' // para aplicar estilos CSS extra si querés
    });
  }

  // Mocks de turnos. TODO: Conectar a API de Spring.
  turnos: Turno[] = [
    { id: 1, fechaInicio: new Date(), cliente: { nombre: 'Juan', apellido: 'Pérez', correo: 'juan.perez@example.com' }, cancha: { id: 1, numero: 1 }, fechaFin: new Date() },
    { id: 2, fechaInicio: new Date(), cliente: { nombre: 'María', apellido: 'Gómez', correo: 'maria.gomez@example.com' }, cancha: { id: 2, numero: 2 }, fechaFin: new Date() },
    { id: 3, fechaInicio: new Date(), cliente: { nombre: 'Pedro', apellido: 'López', correo: 'pedro.lopez@example.com' }, cancha: { id: 3, numero: 3 }, fechaFin: new Date() }
  ];
  
  editarTurno(turno: Turno) {
    // Lógica para editar el turno
  }

  eliminarTurno(turno: Turno) {
    // Lógica para eliminar el turno
  }

  agregarTurno() {
    // Lógica para agregar un nuevo turno
  }
}
