import { Component, OnInit, HostListener } from '@angular/core';
import { Turno } from './turno.model';
import { TurnoService } from '../../services/turno.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HorariosService } from '../../services/horarios.service';
import { IHorario } from '../../interfaces/IHorario';
import { firstValueFrom, map, toArray } from 'rxjs';
import { ICancha } from '../../interfaces/ICancha';

@Component({
  selector: 'app-turnos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './turnos.component.html',
  styleUrls: ['./turnos.component.css']
})
export class TurnosComponent implements OnInit {
  turnos: Turno[] = [];
  isAuthenticated: boolean = false;
  userEmail: string = '';

  // Variables para el flujo de reserva
  currentStep: number = 1;
  currentMonth: Date = new Date();
  selectedDate: Date | null = null;
  selectedTimeSlot: any = null;
  selectedCancha: any = null;
  selectedPaymentMethod: string | null = null;
  reservationCode: string = '';
  showDropdown: boolean = false;
  
  // Datos del usuario para reservas sin autenticación
  userData = {
    nombre: '',
    apellido: '',
    email: ''
  };

  // Datos del calendario
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Tue', 'Fri', 'Sat'];
  calendarDays: any[] = [];

  // Datos de canchas y horarios
  canchas = [
    { id: 1, nombre: 'Court 1', precio: 5000 },
    { id: 2, nombre: 'Court 2', precio: 4500 },
    { id: 3, nombre: 'Court 3', precio: 4000 },
    { id: 4, nombre: 'Court 4', precio: 3500 }
  ];
  
    horarios: IHorario[] = [ {id: 1, cancha: {id: 1, numero: '1'}, horaInicio:'12:30', horaFin: '14:30'} 
  ]
  
  // Métodos de pago
  paymentMethods = [
    { id: 'credit', name: 'Credit card', icon: 'fas fa-credit-card' },
    { id: 'debit', name: 'Debit card', icon: 'fas fa-credit-card' },
    { id: 'transfer', name: 'Transfer', icon: 'fas fa-university' },
  ];

  constructor(
    private turnoService: TurnoService,
    private router: Router,
    private horarioService: HorariosService
  ) {}

  ngOnInit() {
    this.verificarAutenticacion();
    this.cargarTurnos();
    this.generateCalendar();
  }

  //Obtener turnos disponibles
  getHorariosDisponibles(date:Date) {
    return this.turnoService.getDisponibles(date);
  }
  
  //Obetener todos los horarios existentes
  getHorarios() {
    return this.horarioService.getHorarios()
  }
  
  //Obtener id todas las canchas
  getCanchas() {
    return this.getHorarios().pipe(map((horarios: IHorario[]) => [...new Set(horarios.map(h => h.cancha))]))
  }
  
  //Obtener canchas disponibles para un dia en especifico
  async getCanchasDate(date: Date): Promise<ICancha[]>{
  try {
    const turnos = await firstValueFrom(this.getHorariosDisponibles(date));
    
    // Mapear todas las canchas
    const canchas = turnos.map(t => t.horario.cancha);

    // Elimino repetidas
    const canchasUnicas = Array.from(new Map(canchas.map(c => [c.id, c])).values());

    return canchasUnicas;

  } catch (error) {
    console.error('Error obteniendo canchas para la fecha', date, error);
    return [];
  }
  }

  verificarAutenticacion() {
    const token = localStorage.getItem('token');
    if (token) {
      this.isAuthenticated = true;
      // Aquí podrías decodificar el JWT para obtener el email del usuario
      // Por ahora, lo obtenemos del localStorage si lo guardaste
      this.userEmail = localStorage.getItem('userEmail') || 'Usuario';
    } else {
      this.isAuthenticated = false;
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

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  verDatosCuenta() {
    this.showDropdown = false;
    // Por ahora solo mostramos un alert, después se puede implementar una pantalla dedicada
    alert(`Datos de la cuenta:\nEmail: ${this.userEmail}\n\nEsta funcionalidad se implementará próximamente.`);
  }

  cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userEmail');
    this.isAuthenticated = false;
    this.userEmail = '';
    this.showDropdown = false;
    // No redirigir, quedarse en /turnos
  }

  // Métodos para el flujo de reserva
  async generateCalendar() {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    this.calendarDays = [];
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = this.isToday(date);
      const isPast = date < new Date() && !isToday;
      const hasAvailability = await this.checkDateAvailability(date);
      const isAvailable = !isPast && isCurrentMonth && hasAvailability;
      
      this.calendarDays.push({
        day: date.getDate(),
        date: new Date(date),
        currentMonth: isCurrentMonth,
        available: isAvailable,
        selected: false
      });
    }
  }
  //Chequear que tiene disponibilidad al menos un turno en el dia
  async checkDateAvailability(date: Date): Promise<boolean> {
    try {
        const arrayTurnosD = await firstValueFrom(this.getHorariosDisponibles(date));
        return arrayTurnosD.length != 0;
    } catch (error) {
        console.error('Error obteniendo turnos:', error);
        return false
    }
    }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  previousMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.generateCalendar();
  }

  nextMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.generateCalendar();
  }

  selectDate(day: any) {
    if (!day.available) return;
    
    // Deseleccionar fecha anterior
    this.calendarDays.forEach(d => d.selected = false);
    
    // Seleccionar nueva fecha
    day.selected = true;
    this.selectedDate = day.date;
    
    // Avanzar al siguiente paso
    this.currentStep = 2;
  }

  goBackToStep(step: number) {
    this.currentStep = step;
    if (step === 1) {
      this.selectedDate = null;
      this.calendarDays.forEach(d => d.selected = false);
    } else if (step === 2) {
      this.selectedTimeSlot = null;
      this.selectedCancha = null;
    } else if (step === 2.5) {
      // Volver al paso de selección de horario
      this.currentStep = 2;
    }
  }

  async cargarHorarios(date:Date) {
    try {
        const horarios = await firstValueFrom(this.getHorarios());
        const horariosDisponibles = await firstValueFrom(this.getHorariosDisponibles(date));

        if (!horariosDisponibles?.length) {
        console.warn('No hay horarios disponibles.');
        // Todos los horarios estarán ocupados
        return horarios.map(h => ({ ...h, ocupado: true }));
        }

        const horariosMarcados = horarios.map(h => ({
        ...h,
        ocupado: !horariosDisponibles.some(d => d.id === h.id)
        }));

        return horariosMarcados;

    } catch (error) {
        console.error('Error obteniendo o procesando horarios:', error);
        return [];
    }
  }

  isSlotSelected(canchaId: number, horarioId: number): boolean {
    return this.selectedCancha?.id === canchaId && this.selectedTimeSlot?.id === horarioId;
  }

  //Borrar?
  getSlotPrice(canchaId: number, horarioId: number): number {
    const cancha = this.canchas.find(c => c.id === canchaId);
    const horario = this.horarios.find(h => h.id === horarioId);
    return 24000;
  }

  //Hay que hacer que esto funcione
  selectTimeSlot(canchaId: number, horarioId: number) {
    // Verificar que el slot esté disponible (estado 1)
    if (this.getSlotStatus(canchaId, horarioId) !== 1) return;
    
    this.selectedCancha = this.canchas.find(c => c.id === canchaId);
    // Crear una copia del horario para evitar modificar el original
    const horarioOriginal = this.horarios.find(h => h.id === horarioId);
    this.selectedTimeSlot = {
      ...horarioOriginal,
      precio: this.getSlotPrice(canchaId, horarioId)
    };
    
    // Si el usuario no está autenticado, ir al paso de datos del usuario
    // Si está autenticado, ir directamente al método de pago
    this.currentStep = this.isAuthenticated ? 3 : 2.5;
  }

  //Borrar?
  selectPaymentMethod(methodId: string) {
    this.selectedPaymentMethod = methodId;
  }

  validateUserData(): boolean {
    return this.userData.nombre.trim() !== '' && 
           this.userData.apellido.trim() !== '' && 
           this.userData.email.trim() !== '' &&
           this.isValidEmail(this.userData.email);
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  //Borrar?
  proceedToPayment() {
    if (this.validateUserData()) {
      this.currentStep = 3;
    }
  }
  
  getDepositAmount(): number {
      return Math.round((this.selectedTimeSlot?.precio || 0) * 0.5);
      }
      
      /*
  getTimeRange(horario: any): string {
    if (!horario) return '';
    
    const startTime = horario.hora;
    const [hours, minutes] = startTime.split(':').map(Number);
    
    // Agregar 2 horas
    const endHours = hours + 2;
    const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    return `${startTime} - ${endTime}`;
  }
*/

  confirmReservation() {
    if (!this.selectedPaymentMethod) return;
    
    // Simular confirmación de reserva
    this.reservationCode = 'RES' + Math.random().toString(36).substr(2, 8).toUpperCase();
    
    // Avanzar al paso de confirmación
    this.currentStep = 4;
  }

  startNewReservation() {
    // Resetear todo para nueva reserva
    this.currentStep = 1;
    this.selectedDate = null;
    this.selectedTimeSlot = null;
    this.selectedCancha = null;
    this.selectedPaymentMethod = null;
    this.reservationCode = '';
    this.calendarDays.forEach(d => d.selected = false);
    // Limpiar datos del usuario
    this.userData = { nombre: '', apellido: '', email: '' };
  }

  // Cerrar dropdown cuando se hace clic fuera
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const accountDropdown = target.closest('.account-dropdown');
    
    if (!accountDropdown && this.showDropdown) {
      this.showDropdown = false;
    }
  }
}
