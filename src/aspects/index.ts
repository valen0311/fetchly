import { FetchlyConfig, RequestOptions } from '../types/index.js';

/**
 * Tipo que representa una función de petición HTTP
 */
type RequestFunction<T> = () => Promise<T>;

/**
 * Aspecto de logging para las peticiones HTTP.
 * Registra en consola el inicio y fin de cada petición.
 * @param method - Método HTTP de la petición
 * @param url - URL de la petición
 * @param fn - Función de petición a ejecutar
 */
export async function loggingAspect<T>(
  method: string,
  url: string,
  fn: RequestFunction<T>
): Promise<T> {
  console.log(`[Fetchly] ➡️ ${method} ${url} - ${new Date().toISOString()}`);
  try {
    const result = await fn();
    console.log(`[Fetchly] ✅ ${method} ${url} - Petición exitosa`);
    return result;
  } catch (error) {
    console.error(`[Fetchly] ❌ ${method} ${url} - Error:`, error);
    throw error;
  }
}

/**
 * Aspecto de validación de configuración.
 * Verifica que la configuración del cliente sea válida antes de ejecutar la petición.
 * @param config - Configuración del cliente
 * @param fn - Función de petición a ejecutar
 */
export async function validationAspect<T>(
  config: FetchlyConfig,
  fn: RequestFunction<T>
): Promise<T> {
  if (config.timeout !== undefined && config.timeout <= 0) {
    throw {
      message: 'El timeout debe ser mayor a 0',
      isTimeout: false,
      isNetworkError: false,
    };
  }

  if (config.retries !== undefined && config.retries < 0) {
    throw {
      message: 'El número de reintentos no puede ser negativo',
      isTimeout: false,
      isNetworkError: false,
    };
  }

  return fn();
}

/**
 * Aspecto de medición de tiempo de respuesta.
 * Mide y registra el tiempo que tarda cada petición.
 * @param method - Método HTTP de la petición
 * @param url - URL de la petición
 * @param fn - Función de petición a ejecutar
 */
export async function timingAspect<T>(
  method: string,
  url: string,
  fn: RequestFunction<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = (performance.now() - start).toFixed(2);
    console.log(`[Fetchly] ⏱️ ${method} ${url} - ${duration}ms`);
    return result;
  } catch (error) {
    const duration = (performance.now() - start).toFixed(2);
    console.error(`[Fetchly] ⏱️ ${method} ${url} - Falló en ${duration}ms`);
    throw error;
  }
}