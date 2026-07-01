/**
 * Tipos de eventos que emite Fetchly
 */
export type FetchlyEventType = 'onSuccess' | 'onError' | 'onRetry' | 'onTimeout';

/**
 * Datos del evento de éxito
 */
export interface SuccessEventData {
  method: string;
  url: string;
  status: number;
  duration: number;
}

/**
 * Datos del evento de error
 */
export interface ErrorEventData {
  method: string;
  url: string;
  message: string;
  status?: number;
}

/**
 * Datos del evento de reintento
 */
export interface RetryEventData {
  method: string;
  url: string;
  attempt: number;
  maxRetries: number;
}

/**
 * Datos del evento de timeout
 */
export interface TimeoutEventData {
  method: string;
  url: string;
  timeout: number;
}

/**
 * Mapa de eventos y sus datos correspondientes
 */
export interface FetchlyEventMap {
  onSuccess: SuccessEventData;
  onError: ErrorEventData;
  onRetry: RetryEventData;
  onTimeout: TimeoutEventData;
}

/**
 * Tipo de función listener para un evento específico
 */
export type EventListener<T extends FetchlyEventType> = (data: FetchlyEventMap[T]) => void;

/**
 * Sistema de eventos de Fetchly.
 * Permite suscribirse y emitir eventos durante el ciclo de vida de las peticiones.
 */
export class FetchlyEventEmitter {
  private listeners: Partial<Record<FetchlyEventType, EventListener<any>[]>> = {};

  /**
   * Suscribe un listener a un evento específico
   * @param event - Tipo de evento
   * @param listener - Función a ejecutar cuando se emita el evento
   */
  on<T extends FetchlyEventType>(event: T, listener: EventListener<T>): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(listener);
  }

  /**
   * Elimina un listener de un evento específico
   * @param event - Tipo de evento
   * @param listener - Función a eliminar
   */
  off<T extends FetchlyEventType>(event: T, listener: EventListener<T>): void {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event]!.filter((l) => l !== listener);
  }

  /**
   * Emite un evento con sus datos correspondientes
   * @param event - Tipo de evento
   * @param data - Datos del evento
   */
  emit<T extends FetchlyEventType>(event: T, data: FetchlyEventMap[T]): void {
    if (!this.listeners[event]) return;
    (this.listeners[event] as EventListener<T>[]).forEach((listener) => listener(data));
  }
}