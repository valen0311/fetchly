import { FetchlyClient } from '../../src/core/index';
import { FetchlyEventEmitter } from '../../src/events/index';

global.fetch = jest.fn();

describe('FetchlyClient', () => {
  let client: FetchlyClient;

  beforeEach(() => {
    client = new FetchlyClient({ baseUrl: 'https://api.ejemplo.com' });
    jest.clearAllMocks();
  });

  describe('Configuración', () => {
    it('debe crear una instancia con la configuración por defecto', () => {
      const clientDefault = new FetchlyClient();
      expect(clientDefault).toBeInstanceOf(FetchlyClient);
      expect(clientDefault.events).toBeInstanceOf(FetchlyEventEmitter);
    });

    it('debe crear una instancia con configuración personalizada', () => {
      const clientCustom = new FetchlyClient({
        baseUrl: 'https://api.ejemplo.com',
        timeout: 3000,
        retries: 2,
      });
      expect(clientCustom).toBeInstanceOf(FetchlyClient);
    });
  });

  describe('Peticiones HTTP', () => {
    it('debe realizar una petición GET exitosa', async () => {
      const mockData = { id: 1, nombre: 'Test' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockData,
      });

      const response = await client.get<typeof mockData>('/usuarios');
      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockData);
    });

    it('debe realizar una petición POST exitosa', async () => {
      const mockData = { id: 1, nombre: 'Nuevo' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers(),
        json: async () => mockData,
      });

      const response = await client.post<typeof mockData>('/usuarios', { nombre: 'Nuevo' });
      expect(response.ok).toBe(true);
      expect(response.status).toBe(201);
      expect(response.data).toEqual(mockData);
    });

    it('debe realizar una petición PUT exitosa', async () => {
      const mockData = { id: 1, nombre: 'Actualizado' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockData,
      });

      const response = await client.put<typeof mockData>('/usuarios/1', { nombre: 'Actualizado' });
      expect(response.ok).toBe(true);
      expect(response.data).toEqual(mockData);
    });

    it('debe realizar una petición PATCH exitosa', async () => {
      const mockData = { id: 1, nombre: 'Parcial' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockData,
      });

      const response = await client.patch<typeof mockData>('/usuarios/1', { nombre: 'Parcial' });
      expect(response.ok).toBe(true);
      expect(response.data).toEqual(mockData);
    });

    it('debe realizar una petición DELETE exitosa', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({}),
      });

      const response = await client.delete('/usuarios/1');
      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
    });
  });

  describe('Manejo de errores', () => {
    it('debe lanzar un error cuando el servidor responde con 500', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers(),
        json: async () => ({}),
      });

      await expect(client.get('/usuarios')).rejects.toMatchObject({
        isTimeout: false,
        isNetworkError: false,
        status: 500,
      });
    });

    it('debe lanzar un error de timeout', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        new Promise((_, reject) => {
          const error = new Error('AbortError');
          error.name = 'AbortError';
          setTimeout(() => reject(error), 100);
        })
      );

      const clientTimeout = new FetchlyClient({ timeout: 50 });
      await expect(clientTimeout.get('https://api.ejemplo.com/usuarios')).rejects.toMatchObject({
        isTimeout: true,
      });
    });

    it('debe lanzar un error de red', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));

      await expect(client.get('/usuarios')).rejects.toMatchObject({
        isNetworkError: true,
      });
    });
  });

  describe('Reintentos', () => {
    it('debe reintentar la petición ante un error 500', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          headers: new Headers(),
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({ id: 1 }),
        });

      const clientRetry = new FetchlyClient({
        baseUrl: 'https://api.ejemplo.com',
        retries: 1,
      });

      const response = await clientRetry.get('/usuarios');
      expect(response.ok).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Sistema de eventos', () => {
    it('debe emitir el evento onSuccess al completar una petición', async () => {
      const mockData = { id: 1 };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockData,
      });

      const onSuccess = jest.fn();
      client.events.on('onSuccess', onSuccess);

      await client.get('/usuarios');
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it('debe emitir el evento onError al fallar una petición', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));

      const onError = jest.fn();
      client.events.on('onError', onError);

      await expect(client.get('/usuarios')).rejects.toBeDefined();
      expect(onError).toHaveBeenCalledTimes(1);
    });
  });

  describe('Validación de configuración', () => {
    it('debe lanzar un error si el timeout es menor o igual a 0', async () => {
      const clientInvalid = new FetchlyClient({ timeout: -1 });
      await expect(clientInvalid.get('https://api.ejemplo.com/usuarios')).rejects.toMatchObject({
        message: 'El timeout debe ser mayor a 0',
      });
    });

    it('debe lanzar un error si los reintentos son negativos', async () => {
      const clientInvalid = new FetchlyClient({ retries: -1 });
      await expect(clientInvalid.get('https://api.ejemplo.com/usuarios')).rejects.toMatchObject({
        message: 'El número de reintentos no puede ser negativo',
      });
    });
  });
});