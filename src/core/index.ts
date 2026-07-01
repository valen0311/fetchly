import { FetchlyConfig, FetchlyError, FetchlyResponse, RequestOptions } from '../types/index.js';

/**
 * Cliente HTTP principal de Fetchly
 * @template T - Tipo de la respuesta esperada
 */
export class FetchlyClient {
  private config: FetchlyConfig;

  /**
   * Crea una instancia del cliente Fetchly
   * @param config - Configuración global del cliente
   */
  constructor(config: FetchlyConfig = {}) {
    this.config = {
      timeout: 5000,
      retries: 0,
      headers: { 'Content-Type': 'application/json' },
      ...config,
    };
  }

  /**
   * Construye la URL completa combinando baseUrl y el path
   * @param path - Ruta del endpoint
   */
  private buildUrl(path: string): string {
    if (this.config.baseUrl) {
      return `${this.config.baseUrl}${path}`;
    }
    return path;
  }

  /**
   * Combina las cabeceras globales con las de la petición
   * @param options - Opciones de la petición
   */
  private buildHeaders(options?: RequestOptions): Record<string, string> {
    return {
      ...this.config.headers,
      ...options?.headers,
    };
  }

  /**
   * Ejecuta una petición HTTP con soporte para timeout y reintentos
   * @param method - Método HTTP
   * @param path - Ruta del endpoint
   * @param options - Opciones de la petición
   */
  private async request<T>(
    method: string,
    path: string,
    options?: RequestOptions
  ): Promise<FetchlyResponse<T>> {
    const url = this.buildUrl(path);
    const headers = this.buildHeaders(options);
    const timeout = options?.timeout ?? this.config.timeout ?? 5000;
    const retries = options?.retries ?? this.config.retries ?? 0;

    let lastError: FetchlyError | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          method,
          headers,
          body: options?.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const data: T = await response.json();

        if (!response.ok && response.status >= 500) {
          throw { message: `Error del servidor: ${response.status}`, status: response.status, isTimeout: false, isNetworkError: false };
        }

        return {
          data,
          status: response.status,
          headers: response.headers,
          ok: response.ok,
        };
      } catch (error: unknown) {
        clearTimeout(timeoutId);

        const isTimeout = (error as Error).name === 'AbortError';
        const isNetworkError = !isTimeout && !(error as FetchlyError).status;

        lastError = {
          message: isTimeout ? 'La petición superó el tiempo de espera' : (error as Error).message,
          status: (error as FetchlyError).status,
          isTimeout,
          isNetworkError,
        };

        const shouldRetry = isTimeout || isNetworkError || ((error as FetchlyError).status ?? 0) >= 500;

        if (!shouldRetry || attempt === retries) {
          throw lastError;
        }
      }
    }

    throw lastError;
  }

  /**
   * Realiza una petición GET
   * @param path - Ruta del endpoint
   * @param options - Opciones de la petición
   */
  async get<T>(path: string, options?: RequestOptions): Promise<FetchlyResponse<T>> {
    return this.request<T>('GET', path, options);
  }

  /**
   * Realiza una petición POST
   * @param path - Ruta del endpoint
   * @param body - Cuerpo de la petición
   * @param options - Opciones de la petición
   */
  async post<T>(path: string, body: unknown, options?: RequestOptions): Promise<FetchlyResponse<T>> {
    return this.request<T>('POST', path, { ...options, body });
  }

  /**
   * Realiza una petición PUT
   * @param path - Ruta del endpoint
   * @param body - Cuerpo de la petición
   * @param options - Opciones de la petición
   */
  async put<T>(path: string, body: unknown, options?: RequestOptions): Promise<FetchlyResponse<T>> {
    return this.request<T>('PUT', path, { ...options, body });
  }

  /**
   * Realiza una petición PATCH
   * @param path - Ruta del endpoint
   * @param body - Cuerpo de la petición
   * @param options - Opciones de la petición
   */
  async patch<T>(path: string, body: unknown, options?: RequestOptions): Promise<FetchlyResponse<T>> {
    return this.request<T>('PATCH', path, { ...options, body });
  }

  /**
   * Realiza una petición DELETE
   * @param path - Ruta del endpoint
   * @param options - Opciones de la petición
   */
  async delete<T>(path: string, options?: RequestOptions): Promise<FetchlyResponse<T>> {
    return this.request<T>('DELETE', path, options);
  }
}