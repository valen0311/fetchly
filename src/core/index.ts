import { FetchlyConfig, FetchlyError, FetchlyResponse, RequestOptions } from '../types/index.js';
import { loggingAspect, timingAspect, validationAspect } from '../aspects/index.js';
import { FetchlyEventEmitter } from '../events/index.js';

/**
 * Cliente HTTP principal de Fetchly
 * @template T - Tipo de la respuesta esperada
 */
export class FetchlyClient {
  private config: FetchlyConfig;
  public readonly events: FetchlyEventEmitter;

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
    this.events = new FetchlyEventEmitter();
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

    return validationAspect(this.config, () =>
      loggingAspect(method, url, () =>
        timingAspect(method, url, () =>
          this.executeRequest<T>(method, url, options)
        )
      )
    );
  }

  /**
   * Ejecuta la petición HTTP con reintentos y manejo de timeout
   * @param method - Método HTTP
   * @param url - URL completa de la petición
   * @param options - Opciones de la petición
   */
  private async executeRequest<T>(
    method: string,
    url: string,
    options?: RequestOptions
  ): Promise<FetchlyResponse<T>> {
    const headers = this.buildHeaders(options);
    const timeout = options?.timeout ?? this.config.timeout ?? 5000;
    const retries = options?.retries ?? this.config.retries ?? 0;
    const start = performance.now();

    let lastError: FetchlyError | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      if (attempt > 0) {
        this.events.emit('onRetry', {
          method,
          url,
          attempt,
          maxRetries: retries,
        });
      }

      try {
        const response = await fetch(url, {
          method,
          headers,
          body: options?.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const data = (await response.json()) as T;

        if (!response.ok && response.status >= 500) {
          throw {
            message: `Error del servidor: ${response.status}`,
            status: response.status,
            isTimeout: false,
            isNetworkError: false,
          };
        }

        const duration = performance.now() - start;

        this.events.emit('onSuccess', {
          method,
          url,
          status: response.status,
          duration,
        });

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
          message: isTimeout
            ? 'La petición superó el tiempo de espera'
            : (error as Error).message,
          status: (error as FetchlyError).status,
          isTimeout,
          isNetworkError,
        };

        if (isTimeout) {
          this.events.emit('onTimeout', { method, url, timeout });
        } else {
          this.events.emit('onError', {
            method,
            url,
            message: lastError.message,
            status: lastError.status,
          });
        }

        const shouldRetry =
          isTimeout ||
          isNetworkError ||
          ((error as FetchlyError).status ?? 0) >= 500;

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