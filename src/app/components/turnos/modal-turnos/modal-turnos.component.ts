import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Turno } from '../turno.model';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TurnoForm } from './turno-form.interface';

import { canchas } from '../../canchas/canchas.mock';

@Component({
  selector: 'app-modal-turnos',
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './modal-turnos.component.html',
  styleUrl: './modal-turnos.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalTurnosComponent {
  private dialogRef = inject(DialogRef<TurnoForm>);
  protected data: Turno | null = inject(DIALOG_DATA);

  protected canchas = canchas;

  protected turnosModal = new FormGroup({
    id: new FormControl<number | null>(this.data?.id || null),
    cancha: new FormControl<{ id: number; numero: number } | null>(this.data?.cancha || null, {
      nonNullable: true,
    }),
    cliente: new FormControl<{ nombre: string; apellido: string; correo: string } | null>(this.data?.cliente || null, {
      nonNullable: false,
    }),
    fechaInicio: new FormControl<Date | null>(this.data?.fechaInicio || null,  {
      nonNullable: false,
      validators: [
        Validators.required,
      ]
    }),
    fechaFin: new FormControl<Date | null>(this.data?.fechaFin || null, {
      nonNullable: false,
      validators: [
        Validators.required,
      ]
    }),
  });

  constructor() {
    if (this.data) {
      this.turnosModal.patchValue(this.data);
    } else {
      this.turnosModal.reset();
    }
  }

  protected guardar(): void {
    if (this.turnosModal.valid) {
      this.dialogRef.close(this.turnosModal.value as TurnoForm);
    }
  }

  protected closeModal(): void {
    this.dialogRef.close();
  }
}
