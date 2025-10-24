import { Component, OnInit, HostListener } from '@angular/core';
import { Turno } from './turno.model';
import { TurnoService } from '../../services/turno.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HorariosService } from '../../services/horarios.service';
import { UsuarioService } from '../../services/usuario.service';
import { ClienteService } from '../../services/cliente.service';
import { IHorario } from '../../interfaces/IHorario';
import { firstValueFrom, map, toArray } from 'rxjs';
import { ICancha } from '../../interfaces/ICancha';
import { ITurno } from '../../interfaces/ITurno';
import { IClienteData } from '../../interfaces/IClienteData';
import { ICliente } from '../../interfaces/ICliente';

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

  // Franjas horarias únicas y mapa de disponibilidad
  franjasHorarias: { horaInicio: string, horaFin: string }[] = [];
  disponibilidadMap: Map<string, boolean> = new Map();

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
    correo: ''
  };

  // Cache para estados de slots (para mantener consistencia)
  slotStatusCache: Map<string, number> = new Map();
  dateAvailabilityCache: Map<string, boolean> = new Map();

  // Datos del calendario
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  calendarDays: any[] = [];

  // Métodos de pago
  paymentMethods = [
    { id: 'credit', name: 'Credit card', icon: 'fas fa-credit-card' },
    { id: 'debit', name: 'Debit card', icon: 'fas fa-credit-card' },
    { id: 'transfer', name: 'Transfer', icon: 'fas fa-university' },
  ];

  constructor(
    private turnoService: TurnoService,
    private router: Router,
    private horarioService: HorariosService,
    private clienteService: ClienteService,
    private userService: UsuarioService
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
      id: Number(item.canchaId), // Convertir a number
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
      await this.cargarHorarios(day.date, this.canchasDisponibles.sort((a, b) => (a.numero).localeCompare(b.numero)));

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

  async cargarHorarios(date: Date, canchas: ICancha[]) {
    try {
        const horarios = await firstValueFrom(this.getHorarios()) as IHorario[];
        const turnosDisponibles = await firstValueFrom(this.getHorariosDisponibles(date));

        // 1. Extraer franjas horarias únicas
        const franjasSet = new Set<string>();
        horarios.forEach(horario => {
            // Normalizar formato de hora (quitar segundos si existen)
            const horaInicio = horario.horaInicio.substring(0, 5); // HH:MM
            const horaFin = horario.horaFin.substring(0, 5); // HH:MM
            const franjaKey = `${horaInicio}-${horaFin}`;
            franjasSet.add(franjaKey);
        });

        // Convertir Set a array de objetos
        this.franjasHorarias = Array.from(franjasSet).map(franjaKey => {
            const [horaInicio, horaFin] = franjaKey.split('-');
            return { horaInicio, horaFin };
        });

        // 2. Crear mapa de disponibilidad
        this.disponibilidadMap.clear();

        // Marcar todos como NO disponibles por defecto
        canchas.forEach(cancha => {
            this.franjasHorarias.forEach(franja => {
                const key = `${cancha.id}-${franja.horaInicio}-${franja.horaFin}`;
                this.disponibilidadMap.set(key, false);
            });
        });

        // Marcar como disponibles los que realmente están disponibles
        // El backend devuelve solo los horarios que NO tienen turnos reservados

        if (turnosDisponibles?.length) {
            turnosDisponibles.forEach(cancha => {
                const canchaId = Number(cancha.canchaId);
                cancha.horarios.forEach(horario => {
                    // Normalizar formato de hora (quitar segundos si existen)
                    const horaInicio = horario.horaInicio.substring(0, 5); // HH:MM
                    const horaFin = horario.horaFin.substring(0, 5); // HH:MM
                    const key = `${canchaId}-${horaInicio}-${horaFin}`;
                    this.disponibilidadMap.set(key, true);
                });
            });
        }

        return this.franjasHorarias;

    } catch (error) {
        console.error('Error obteniendo o procesando horarios:', error);
        this.franjasHorarias = [];
        this.disponibilidadMap.clear();
        return [];
    }
  }

  isSlotSelected(canchaId: number, horaInicio: string, horaFin: string): boolean {
    return this.selectedCancha?.id === canchaId &&
           this.selectedTimeSlot?.horaInicio === horaInicio &&
           this.selectedTimeSlot?.horaFin === horaFin;
  }

  isSlotAvailable(canchaId: number, horaInicio: string, horaFin: string): boolean {
    const key = `${canchaId}-${horaInicio}-${horaFin}`;
    return this.disponibilidadMap.get(key) || false;
  }

  selectTimeSlot(canchaId: number, horaInicio: string, horaFin: string) {
    // Verificar que el slot esté disponible
    if (!this.isSlotAvailable(canchaId, horaInicio, horaFin)) return;

    // Buscar la cancha seleccionada
    const canchaSeleccionada = this.canchasDisponibles.find(c => c.id === canchaId);
    if (!canchaSeleccionada) return;

    // Guardar selección
    this.selectedCancha = canchaSeleccionada;
    this.selectedTimeSlot = {
      horaInicio,
      horaFin,
      precio: 20000
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
           this.userData.correo.trim() !== '' &&
           this.isValidEmail(this.userData.correo);
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

  getTimeRange(timeSlot: any): string {
    if (!timeSlot) return '';
    return `${timeSlot.horaInicio}-${timeSlot.horaFin}`;
  }


  //TODO: Hay que cambiar este metodo para que nos devuelva la informacion del usuario autenticado
  //TODO: Abria que crear un endpoint en el backend para obtener la informacion del usuario autenticado y que devuelva un objeto con los datos del usuario
  getClienteAutenticado() {
    if (this.isAuthenticated) {
      // Para usuarios autenticados, necesitamos buscar o crear un cliente
      // Por ahora retornamos null para manejar la creación en confirmReservation
      return null;
    } else {
      // Para usuarios no autenticados, necesitamos crear un cliente primero
      return null;
    }
  }

  async confirmReservation() {
    if (!this.selectedPaymentMethod) return;

    try {
      // Obtener todos los horarios del sistema para buscar el ID correcto
      const horarios = await firstValueFrom(this.getHorarios()) as IHorario[];

      // Buscar el horario ID correspondiente usando la información disponible
      const horario = horarios.find(h => {
        const horaInicioMatch = h.horaInicio && h.horaInicio.substring(0, 5) === this.selectedTimeSlot.horaInicio;
        const horaFinMatch = h.horaFin && h.horaFin.substring(0, 5) === this.selectedTimeSlot.horaFin;

        return horaInicioMatch && horaFinMatch;
      });

      if (!horario) {
        alert('Error: No se pudo encontrar el horario seleccionado.');
        return;
      }

      // Crear cliente para ambos casos (autenticados y no autenticados)
      let clienteData: IClienteData = {
        nombre: '',
        apellido: '',
        correo: ''
      };

      //TODO: Este if tendria que ser reemplazado por el metodo getClienteAutenticado()
      if (this.isAuthenticated) {
        // Para usuarios autenticados, usar datos del token/localStorage
        // Extraer nombre del email (parte antes del @)
        const emailParts = this.userEmail.split('@');
        const nombreUsuario = emailParts[0] || 'Usuario';

        const token = localStorage.getItem('token')

        if (token) {
          const userData = await firstValueFrom(this.userService.getInfoUsuario(token))
          console.log('userData', userData)
          clienteData = {
            nombre: userData.firstName,
            apellido: userData.lastName,
            correo: userData.email
          }
        }
      } else {
        // Para usuarios no autenticados, usar datos del formulario
        clienteData = {
          nombre: this.userData.nombre,
          apellido: this.userData.apellido,
          correo: this.userData.correo
        };
      }

    // Buscar cliente por correo
    let clientes = await firstValueFrom(this.clienteService.getClienteByEmail(clienteData.correo));
    let cliente: ICliente
    console.log('Clientes encontrado:',clientes)

    if (!clientes || clientes.length == 0) {
      // Cliente no existe, crear
      console.log('Cliente no encontrado, creando')
      cliente = await firstValueFrom(this.clienteService.crearCliente(clienteData));
    } else {
      cliente = clientes[0]
    }

    console.log('Cliente final:',cliente)

    this.crearTurnoConCliente(cliente.id, horario)

      // Buscar o crear cliente usando el nuevo método
      //this.clienteService.getClienteByEmail(clienteData.correo).subscribe({
      //  next: (cliente) => {
      //   this.crearTurnoConCliente(cliente.id, horario);
      //  },
      //  error: (error) => {
      //    console.error('Error buscando/creando cliente:', error);
      //    alert('Error al procesar el cliente. Por favor intente nuevamente.');
      //  }
      //});
    } catch (error) {
      console.error('Error obteniendo horarios:', error);
      alert('Error al obtener información del horario. Por favor intente nuevamente.');
    }
  }

  private crearTurnoConCliente(clienteId: number, horario: any) {
    const turnoData = {
      clienteId: clienteId,
      horarioId: horario.id,
      fecha: this.selectedDate?.toISOString().split('T')[0]
    };

    this.turnoService.crearTurno(turnoData).subscribe({
      next: (turno) => {
        this.reservationCode = turno.id;
        this.currentStep = 4;
      },
      error: (error) => {
        console.error('Error creando turno:', error);
        alert('Error al crear la reserva. Por favor intente nuevamente.');
      }
    });
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
    this.userData = { nombre: '', apellido: '', correo: '' };
    // Limpiar cache para generar nuevos estados
    this.slotStatusCache.clear();
    this.dateAvailabilityCache.clear();
    this.disponibilidadMap.clear();
    this.franjasHorarias = [];
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
