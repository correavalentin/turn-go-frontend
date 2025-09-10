import { Component, OnInit, HostListener } from '@angular/core';
import { Turno } from './turno.model';
import { TurnoService } from '../../services/turno.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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
  
  // Cache para estados de slots (para mantener consistencia)
  slotStatusCache: Map<string, number> = new Map();
  dateAvailabilityCache: Map<string, boolean> = new Map();

  // Datos del calendario
  weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  calendarDays: any[] = [];

  // Datos de canchas y horarios
  canchas = [
    { id: 1, nombre: 'Cancha 1', precio: 5000 },
    { id: 2, nombre: 'Cancha 2', precio: 4500 },
    { id: 3, nombre: 'Cancha 3', precio: 4000 },
    { id: 4, nombre: 'Cancha 4', precio: 3500 }
  ];

  horarios = [
    { id: 1, hora: '08:00', precio: 1.0 },
    { id: 2, hora: '09:00', precio: 1.0 },
    { id: 3, hora: '10:00', precio: 1.0 },
    { id: 4, hora: '11:00', precio: 1.0 },
    { id: 5, hora: '12:00', precio: 1.2 },
    { id: 6, hora: '13:00', precio: 1.2 },
    { id: 7, hora: '14:00', precio: 1.2 },
    { id: 8, hora: '15:00', precio: 1.0 },
    { id: 9, hora: '16:00', precio: 1.0 },
    { id: 10, hora: '17:00', precio: 1.0 },
    { id: 11, hora: '18:00', precio: 1.0 },
    { id: 12, hora: '19:00', precio: 1.2 },
    { id: 13, hora: '20:00', precio: 1.2 },
    { id: 14, hora: '21:00', precio: 1.2 }
  ];

  // Métodos de pago
  paymentMethods = [
    { id: 'credit', name: 'Tarjeta de Crédito', icon: 'fas fa-credit-card' },
    { id: 'debit', name: 'Tarjeta de Débito', icon: 'fas fa-credit-card' },
    { id: 'transfer', name: 'Transferencia', icon: 'fas fa-university' },
    { id: 'cash', name: 'Efectivo', icon: 'fas fa-money-bill-wave' }
  ];

  constructor(
    private turnoService: TurnoService,
    private router: Router
  ) {}

  ngOnInit() {
    this.verificarAutenticacion();
    this.cargarTurnos();
    this.generateCalendar();
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
  generateCalendar() {
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
      const hasAvailability = this.checkDateAvailability(date);
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

  checkDateAvailability(date: Date): boolean {
    // Usar cache para mantener consistencia de disponibilidad de fechas
    const key = date.toDateString();
    
    if (!this.dateAvailabilityCache.has(key)) {
      // Simular disponibilidad de fechas - en el futuro esto vendrá del backend
      // Simular que algunos días tienen turnos disponibles y otros no
      const random = Math.random();
      const isAvailable = random > 0.2; // 80% de días con disponibilidad
      this.dateAvailabilityCache.set(key, isAvailable);
    }
    
    return this.dateAvailabilityCache.get(key)!;
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

  isSlotAvailable(canchaId: number, horarioId: number): boolean {
    // Usar el mismo cache que getSlotStatus para consistencia
    return this.getSlotStatus(canchaId, horarioId) === 1;
  }

  getSlotStatus(canchaId: number, horarioId: number): number {
    // Usar cache para mantener consistencia del estado
    const key = `${canchaId}-${horarioId}`;
    
    if (!this.slotStatusCache.has(key)) {
      // Simular estado del slot - en el futuro esto vendrá del backend
      // Estado 1 = disponible, Estado 2 = ocupado
      const random = Math.random();
      const status = random > 0.3 ? 1 : 2;
      this.slotStatusCache.set(key, status);
    }
    
    return this.slotStatusCache.get(key)!;
  }

  isSlotSelected(canchaId: number, horarioId: number): boolean {
    return this.selectedCancha?.id === canchaId && this.selectedTimeSlot?.id === horarioId;
  }

  getSlotPrice(canchaId: number, horarioId: number): number {
    const cancha = this.canchas.find(c => c.id === canchaId);
    const horario = this.horarios.find(h => h.id === horarioId);
    return Math.round(cancha!.precio * horario!.precio);
  }

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

  proceedToPayment() {
    if (this.validateUserData()) {
      this.currentStep = 3;
    }
  }

  getDepositAmount(): number {
    return Math.round((this.selectedTimeSlot?.precio || 0) * 0.5);
  }

  getTimeRange(horario: any): string {
    if (!horario) return '';
    
    const startTime = horario.hora;
    const [hours, minutes] = startTime.split(':').map(Number);
    
    // Agregar 2 horas
    const endHours = hours + 2;
    const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    return `${startTime} - ${endTime}`;
  }

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
    // Limpiar cache para generar nuevos estados
    this.slotStatusCache.clear();
    this.dateAvailabilityCache.clear();
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
