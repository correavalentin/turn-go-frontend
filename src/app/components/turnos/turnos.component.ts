import { Component, OnInit, HostListener } from '@angular/core';
import { Turno } from './turno.model';
import { TurnoService } from '../../services/turno.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HorariosService } from '../../services/horarios.service';
import { UsuarioService } from '../../services/usuario.service';
import { ClienteService } from '../../services/cliente.service';
import { IHorario } from '../../interfaces/IHorario';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { ICancha } from '../../interfaces/ICancha';
import { ITurno } from '../../interfaces/ITurno';
import { IClienteData } from '../../interfaces/IClienteData';
import { ICliente } from '../../interfaces/ICliente';

@Component({
  selector: 'app-turnos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './turnos.component.html',
  styleUrls: ['./turnos.component.css']
})
export class TurnosComponent implements OnInit {
  turnos: ITurno[] = [];
  isAuthenticated: boolean = false;
  userEmail: string = '';
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

  // Token del captcha (Cloudflare Turnstile)
  captchaToken: string | null = null;
  private turnstileWidgetId: string | null = null;
  
  // Flag para evitar múltiples envíos simultáneos
  isProcessingReservation: boolean = false;

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

  /**
   * Obtiene los datos del cliente a partir del usuario autenticado (servicio de usuarios).
   * Si el token es inválido/expirado (401), limpia la sesión y redirige a login.
   * Si ocurre otro error, muestra un mensaje y corta el flujo.
   */
  private async obtenerClienteDataDesdeUsuarioAutenticado(): Promise<IClienteData | null> {
    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }

    try {
      const userData = await firstValueFrom(this.userService.getInfoUsuario(token));

      const clienteData: IClienteData = {
        id: userData.id,
        nombre: userData.firstName,
        apellido: userData.lastName,
        correo: userData.email
      };

      return clienteData;
    } catch (error: any) {
      // Si el token es inválido/expirado, el backend de users-api responde 401
      if (error?.status === 401) {
        alert('Tu sesión ha expirado o no es válida. Por favor, vuelve a iniciar sesión.');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userEmail');
        this.router.navigate(['/login']);
        return null;
      }

      // Otros errores al obtener la info del usuario
      console.error('Error obteniendo información de la cuenta del usuario:', error);
      alert('No se pudo obtener la información de tu cuenta. Intenta nuevamente más tarde.');
      return null;
    }
  }

  private initTurnstileWidget(): void {
    const tryRender = () => {
      const widgetContainer = document.getElementById('turnstile-widget');
      if (!widgetContainer) {
        // Todavía no se renderizó el paso 3
        setTimeout(tryRender, 200);
        return;
      }

      const turnstileGlobal = (window as any).turnstile;
      if (typeof turnstileGlobal === 'undefined') {
        // Script de Turnstile aún no cargó
        setTimeout(tryRender, 200);
        return;
      }

      // Si ya hay un widget renderizado, resetear antes de crear uno nuevo
      if (this.turnstileWidgetId !== null) {
        try {
          turnstileGlobal.reset(this.turnstileWidgetId);
        } catch (e) {
          console.warn('Error reseteando widget de Turnstile:', e);
        }
      }

      this.turnstileWidgetId = turnstileGlobal.render('#turnstile-widget', {
        sitekey: '0x4AAAAAACBKrdqR4zRygUsl',
        callback: (token: string) => {
          console.log('Turnstile token recibido:', token);
          this.captchaToken = token;
        },
      });
    };

    tryRender();
  }

  private resetTurnstileWidget(): void {
    const turnstileGlobal = (window as any).turnstile;
    if (typeof turnstileGlobal !== 'undefined' && this.turnstileWidgetId !== null) {
      try {
        turnstileGlobal.reset(this.turnstileWidgetId);
        console.log('Widget de Turnstile reseteado');
      } catch (e) {
        console.warn('Error reseteando widget de Turnstile:', e);
      }
    }
  }

  //Obtener turnos disponibles
  getHorariosDisponibles(date:Date) {
    return this.turnoService.getDisponibles(date);
  }

  //Obetener todos los horarios existentes
  getHorarios() {
    return this.horarioService.getHorarios()
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

    // Si el usuario está autenticado y va directo al paso 3, inicializar Turnstile
    if (this.isAuthenticated) {
      this.initTurnstileWidget();
    }
  }

  //Borrar?
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

  //Borrar?
  proceedToPayment() {
    if (this.validateUserData()) {
      this.currentStep = 3;
      // Usuario no autenticado: al llegar al paso 3, inicializar Turnstile
      this.initTurnstileWidget();
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

    if (!this.captchaToken) {
      alert('Por favor completa el captcha antes de confirmar la reserva.');
      return;
    }

    // Evitar múltiples envíos simultáneos
    if (this.isProcessingReservation) {
      return;
    }

    this.isProcessingReservation = true;

    try {
      // 1) Obtener horario correspondiente al slot seleccionado
      const horarios = await firstValueFrom(this.getHorarios()) as IHorario[];

      const horario = horarios.find(h => {
        const horaInicioMatch = h.horaInicio && h.horaInicio.substring(0, 5) === this.selectedTimeSlot.horaInicio;
        const horaFinMatch = h.horaFin && h.horaFin.substring(0, 5) === this.selectedTimeSlot.horaFin;
        return horaInicioMatch && horaFinMatch;
      });

      if (!horario) {
        alert('Error: No se pudo encontrar el horario seleccionado.');
        this.isProcessingReservation = false;
        return;
      }

      // 2) Resolver datos del cliente (autenticado o no autenticado)
      let clienteData: IClienteData | null = await this.obtenerClienteDataDesdeUsuarioAutenticado();

      // Si no hay datos de cliente autenticado, usar los datos del formulario (flujo no autenticado)
      if (!clienteData) {
        // Si el usuario estaba autenticado pero su sesión expiró, obtenerClienteDataDesdeUsuarioAutenticado
        // ya mostró mensaje y redirigió a login, así que cortamos aquí.
        const token = localStorage.getItem('token');
        if (token) {
          this.isProcessingReservation = false;
          return;
        }

        clienteData = {
          nombre: this.userData.nombre,
          apellido: this.userData.apellido,
          correo: this.userData.correo
        };
      }

      // 3) Buscar o crear cliente en el backend de turnos
      const clientes = await firstValueFrom(this.clienteService.getClienteByEmail(clienteData.correo));
      let cliente: ICliente;

      if (!clientes || clientes.length === 0) {
        const { id, ...clienteSinId } = clienteData;
        cliente = await firstValueFrom(this.clienteService.crearCliente(clienteSinId));
      } else {
        cliente = clientes[0];
      }

      if (clienteData.id) {
        await lastValueFrom(this.clienteService.asignarUserId(cliente.id, clienteData.id));
      }

      // 4) Crear turno
      this.crearTurnoConCliente(cliente.id, horario);

    } catch (error) {
      console.error('Error obteniendo información para la reserva:', error);
      alert('Ocurrió un error al preparar la reserva. Por favor intente nuevamente.');
      this.isProcessingReservation = false;
    }
  }

  private crearTurnoConCliente(clienteId: number, horario: any) {
    const turnoData = {
      clienteId: clienteId,
      horarioId: horario.id,
      fecha: this.selectedDate?.toISOString().split('T')[0],
      captchaToken: this.captchaToken
    };

    this.turnoService.crearTurno(turnoData as any).subscribe({
      next: async (turno) => {
        this.reservationCode = String(turno.id);
        this.currentStep = 4;
        
        // Resetear el captcha después de usar el token
        this.captchaToken = null;
        this.isProcessingReservation = false;

        // Refrescar disponibilidad del día seleccionado después de crear el turno
        if (this.selectedDate && this.canchasDisponibles.length > 0) {
          try {
            await this.cargarHorarios(this.selectedDate, this.canchasDisponibles);
          } catch (e) {
            console.error('Error refrescando disponibilidad después de crear el turno:', e);
          }
        }
      },
      error: (error) => {
        console.error('Error creando turno:', error);
        
        // Resetear el captcha y permitir nuevo intento
        this.captchaToken = null;
        this.isProcessingReservation = false;
        this.resetTurnstileWidget();

        if (error.status === 409) {
          alert('El turno seleccionado ya fue reservado por otro usuario. Actualiza la página y elige otro horario.');
        } else if (error.status === 500 && error.error?.message === 'Captcha inválido. No se puede crear el turno.') {
          alert('Hubo un problema con el captcha. Por favor resuelve el captcha nuevamente y vuelve a intentarlo.');
        } else {
          alert('Error al crear la reserva. Por favor intente nuevamente.');
        }
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
    // Regenerar calendario con disponibilidad actualizada
    this.generateCalendar();
  }

  routeToHome() {
    window.location.href = '/'
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
