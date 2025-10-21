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
import { ITurno } from '../../interfaces/ITurno';

@Component({
  selector: 'app-turnos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './turnos.component.html',
  styleUrls: ['./turnos.component.css']
})
export class TurnosComponent implements OnInit {
  turnos: ITurno[] = [];
  isAuthenticated: boolean = false;
  userEmail: string = '';
  horariosMarcados: any[] = []; 
  canchasDisponibles: ICancha[] = [];

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
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Tue', 'Fri', 'Sat'];
  calendarDays: any[] = [];

  // Datos de canchas y horarios
  canchas = [
    { id: 1, nombre: 'Court 1', precio: 5000 },
    { id: 2, nombre: 'Court 2', precio: 4500 },
    { id: 3, nombre: 'Court 3', precio: 4000 },
    { id: 4, nombre: 'Court 4', precio: 3500 }
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
    const response = await firstValueFrom(this.getHorariosDisponibles(date));
    
    // Mapear las canchas de la respuesta del backend
    const canchas = response.map(item => ({
      id: item.canchaId,
      numero: item.numeroCancha
    }));

    // Eliminar repetidas
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
    let availableDaysCount = 0;
    
    // Generar todos los días del calendario
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = this.isToday(date);
      const isPast = date < new Date() && !isToday;
      
      // Solo verificar disponibilidad para días del mes actual que no sean pasados
      let hasAvailability = false;
      if (isCurrentMonth && !isPast) {
        hasAvailability = await this.checkDateAvailability(date);
        if (hasAvailability) {
          availableDaysCount++;
        }
      }
      
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
        const response = await firstValueFrom(this.getHorariosDisponibles(date));
        
        // Verificar si hay al menos una cancha con horarios disponibles
        const hasAvailability = response && response.length > 0 && 
          response.some(cancha => cancha.horarios && cancha.horarios.length > 0);
        
        return hasAvailability;
    } catch (error) {
        console.error('Error obteniendo turnos para fecha:', date, error);
        return false;
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
  
  async selectDate(day: any) {
    if (!day.available) return;
    
    this.calendarDays.forEach(d => d.selected = false);
    day.selected = true;
    this.selectedDate = day.date;
    
    try {
      // Cargar canchas y horarios disponibles para la fecha seleccionada
      this.canchasDisponibles = await this.getCanchasDate(day.date);
      this.horariosMarcados = await this.cargarHorarios(day.date);

      // Avanzar al siguiente paso
      this.currentStep = 2;
    } catch (error) {
      console.error('Error cargando datos para la fecha seleccionada:', error);
      // Mostrar mensaje de error al usuario si es necesario
    }
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

  async cargarHorarios(date: Date) {
    try {
        const horarios = await firstValueFrom(this.getHorarios()) as IHorario[];
        const turnosDisponibles = await firstValueFrom(this.getHorariosDisponibles(date));

        if (!turnosDisponibles?.length) {
            console.warn('No hay turnos disponibles.');
            // Todos los horarios estarán ocupados
            return horarios.map((h: IHorario) => ({ ...h, ocupado: true }));
        }

        // Crear un mapa de horarios disponibles por cancha
        const horariosDisponiblesMap = new Map();
        turnosDisponibles.forEach(cancha => {
            cancha.horarios.forEach(horario => {
                const key = `${cancha.canchaId}-${horario.horarioId}`;
                horariosDisponiblesMap.set(key, true);
            });
        });

        const horariosMarcados = horarios.map((h: IHorario) => {
            const key = `${h.cancha.id}-${h.id}`;
            const estaDisponible = horariosDisponiblesMap.has(key);
            
            return {
                ...h,
                ocupado: !estaDisponible
            };
        });

        return horariosMarcados;

    } catch (error) {
        console.error('Error obteniendo o procesando horarios:', error);
        return [];
    }
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
    // Buscar el horario seleccionado
    const horarioSeleccionado = this.horariosMarcados.find(h => h.id === horarioId);
    if (!horarioSeleccionado || horarioSeleccionado.ocupado) return;

    // Buscar la cancha seleccionada
    const canchaSeleccionada = this.canchasDisponibles.find(c => c.id === canchaId);
    if (!canchaSeleccionada) return;

    // Guardar selección
    this.selectedCancha = canchaSeleccionada;
    this.selectedTimeSlot = {
      ...horarioSeleccionado,
      precio: this.getSlotPrice(canchaId, horarioId)
    };

    // Avanzar según autenticación
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
    return `${horario.horaInicio}-${horario.horaFin}`;
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
