import { JornadaTask } from '../types';

export const MORNING_TASKS: JornadaTask[] = [
  { id: 'm1', text: 'Marcar tarjeta' },
  { id: 'm2', text: 'Desactivar alarma' },
  { id: 'm3', text: 'Reenviar conciliaciones a Manuel Rojas' },
  { id: 'm4', text: 'Cambiar cinta de respaldo' },
  { id: 'm-cam', text: 'Verificar Cámaras' }, // Nueva tarea
  // Tareas agregadas según solicitud del usuario
  { id: 'm5', text: 'Realizar proceso de liquidación encomienda de gerencia', days: [2, 3, 4, 5, 6] }, // Martes a Sábado
  { id: 'm6', text: 'Registrar nómina de pasajeros', days: [0, 6] }, // Sábados y Domingos (feriados no soportado)
];

export const AFTERNOON_TASKS: JornadaTask[] = [
  { id: 'a1', text: 'Inicializar cinta encomiendas' },
  { id: 'a2', text: 'Ejecutar respaldo encomiendas', days: [1, 2, 3, 4, 5] }, // Lunes a Viernes
  { id: 'a3', text: 'Inicializar cinta pasajes' },
  { id: 'a4', text: 'Ejecutar respaldo pasajes' },
  { id: 'a-cam', text: 'Verificar Cámaras' }, // Nueva tarea
  { id: 'a5', text: 'Revisar luces del edificio (apagar si están encendidas)' },
  { id: 'a6', text: 'Cerrar ventanas abiertas' },
  { id: 'a7', text: 'Ajustar calefactor al mínimo (para que se apague)' },
  { id: 'a8', text: 'Marcar tarjeta' },
  { id: 'a9', text: 'Activar alarma' },
  { id: 'a10', text: 'Dejar llave de puerta principal en su caja y entregarla al guardia' },
  // Tareas agregadas según solicitud del usuario para fines de semana
  { id: 'a11', text: 'Traspasar número de soporte a celular (14:00 hrs)', days: [0, 6] },
  { id: 'a12', text: 'Quitar el traspaso telefónico (20:30 hrs)', days: [0, 6] },
];