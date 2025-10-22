export enum Screen {
  Login,
  Main,
  // Camera Module
  CameraCheck,
  CameraHistory,
  CameraAdmin,
  // Jornada Module
  JornadaCheck,
  JornadaHistory,
}

export enum DeviceStatus {
  NotChecked = 'NOT_CHECKED',
  OK = 'OK',
  NoConnection = 'SC',
  InRepair = 'ER',
}

export interface Camera {
  id: string;
  city: string;
  section: string;
  number: string;
  location: string;
  ip: string;
}

export interface Server {
  id: string;
  ip: string; // The IP of the DVR/NVR, which the user calls a server
  cameras: Camera[];
}

export interface DeviceState {
  status: DeviceStatus;
  observation: string;
}

export interface CameraCheckRecord {
  id:string;
  date: string;
  operator: string;
  generalObservations: string;
  cameraStates: Record<string, DeviceState>; // Key is the camera ID
  serverStates: Record<string, boolean>; // Key is server ID
}

export type Shift = 'Mañana' | 'Tarde';

export interface JornadaTask {
  id: string;
  text: string;
  days?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat. undefined means all days.
}

export interface JornadaCheckRecord {
  id: string;
  date: string;
  operator: string;
  shift: Shift;
  completedTasks: string[]; // array of task ids
  observations: string;
}

// Kept for backward compatibility with localStorage, can be removed in future versions
export interface CheckRecord extends CameraCheckRecord {}

export interface ExportData {
  operators: string[];
  servers: Server[];
  helpText: string;
  checkHistory: CameraCheckRecord[];
  jornadaHistory: JornadaCheckRecord[];
}
