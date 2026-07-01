/**
 * Métodos HTTP soportados por Fetchly
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Configuración global del cliente Fetchly
 */
export interface FetchlyConfig {
  /** URL base para todas las peticiones */
  baseUrl?: string;
  /** Tiempo máximo de espera en milisegundos */
  timeout?: number;
  /** Número de reintentos ante fallos */
  retries?: number;
  /** Cabeceras por defecto para todas las peticiones */
  headers?: Record<string, string>;
}

/**
 * Opciones específicas para cada petición
 */
export interface RequestOptions {
  /** Cabeceras adicionales para esta petición */
  headers?: Record<string, string>;
  /** Tiempo máximo de espera en milisegundos (sobreescribe el global) */
  timeout?: number;
  /** Número de reintentos (sobreescribe el global) */
  retries?: number;
  /** Cuerpo de la petición */
  body?: unknown;
}

/**
 * Respuesta estándar de Fetchly
 */
export interface FetchlyResponse<T> {
  /** Datos de la respuesta */
  data: T;
  /** Código de estado HTTP */
  status: number;
  /** Cabeceras de la respuesta */
  headers: Headers;
  /** Indica si la petición fue exitosa */
  ok: boolean;
}

/**
 * Estructura de un error de Fetchly
 */
export interface FetchlyError {
  /** Mensaje del error */
  message: string;
  /** Código de estado HTTP si aplica */
  status?: number;
  /** Indica si el error fue por timeout */
  isTimeout: boolean;
  /** Indica si el error fue por un problema de red */
  isNetworkError: boolean;
}
