import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Turno } from '../turno.model';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TurnoForm } from './turno-form.interface';
import { DatePickerModule } from 'primeng/datepicker'
import { canchas } from '../../canchas/canchas.mock';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-modal-turnos',
  imports: [ReactiveFormsModule, FormsModule, DatePickerModule, CommonModule],
  templateUrl: './modal-turnos.component.html',
  styleUrl: './modal-turnos.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalTurnosComponent implements OnInit {
  private dialogRef = inject(DialogRef<TurnoForm>);
  protected data: Turno | null = inject(DIALOG_DATA);

  protected minDate = new Date();

  protected canchas = canchas; // Mocks de canchas

  turnosModal!: FormGroup;

  constructor(private fb: FormBuilder) {}
  ngOnInit(): void {
    this.turnosModal = this.fb.group({
      id: [this.data?.id || null],
      cancha: [this.data?.cancha || null, Validators.required],
      cliente: this.fb.group({
        nombre: [this.data?.cliente?.nombre || '', Validators.required],
        apellido: [this.data?.cliente?.apellido || '', Validators.required],
        correo: [this.data?.cliente?.correo || '', [Validators.required, Validators.email]],
      }),
      fechaInicio: [this.data?.fechaInicio || null, Validators.required],
      fechaFin: [this.data?.fechaFin || null, Validators.required],
    });
  }

  protected guardar(): void {
    if (this.turnosModal.valid) {
      this.dialogRef.close(this.turnosModal.value);
    }
  }

  protected closeModal(): void {
    this.dialogRef.close();
  }
}
