# Fetchly 🚀

Fetchly es una librería TypeScript que actúa como wrapper avanzado sobre la API nativa `fetch`, proporcionando una interfaz limpia, resiliente y altamente configurable para realizar peticiones HTTP.

## Características

- ✅ Soporte para métodos GET, POST, PUT, PATCH y DELETE
- ⏱️ Timeout configurable con cancelación automática
- 🔄 Reintentos automáticos ante errores de servidor o red
- 🎯 Tipado genérico para las respuestas
- 🔍 Sistema de aspectos (logging, validación, métricas)
- 📡 Sistema de eventos (onSuccess, onError, onRetry, onTimeout)
- 📝 Compatible con async/await y Promises

## Instalación

```bash
npm install fetchly
```

## Integración en un proyecto

```typescript
import { FetchlyClient } from 'fetchly';

const client = new FetchlyClient({
  baseUrl: 'https://api.ejemplo.com',
  timeout: 5000,
  retries: 2,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer tu-token',
  },
});
```

## Uso

### GET

```typescript
interface Usuario {
  id: number;
  name: string;
  email: string;
}

// Con async/await
const response = await client.get<Usuario[]>('/usuarios');
console.log(response.data);

// Con Promises
client.get<Usuario>('/usuarios/1')
  .then(response => console.log(response.data))
  .catch(error => console.error(error.message));
```

### POST

```typescript
const nuevoUsuario = { name: 'Valentina', email: 'valen@ejemplo.com' };
const response = await client.post<Usuario>('/usuarios', nuevoUsuario);
console.log(response.data);
```

### PUT

```typescript
const response = await client.put<Usuario>('/usuarios/1', { name: 'Valentina', email: 'nuevo@ejemplo.com' });
console.log(response.data);
```

### PATCH

```typescript
const response = await client.patch<Usuario>('/usuarios/1', { name: 'Valen' });
console.log(response.data);
```

### DELETE

```typescript
const response = await client.delete('/usuarios/1');
console.log(response.status);
```

## Opciones por petición

Puedes sobreescribir la configuración global en cada petición:

```typescript
const response = await client.get<Usuario>('/usuarios/1', {
  timeout: 3000,
  retries: 1,
  headers: { 'X-Custom-Header': 'valor' },
});
```

## Sistema de eventos

```typescript
client.events.on('onSuccess', (data) => {
  console.log(`Petición exitosa: ${data.method} ${data.url} en ${data.duration}ms`);
});

client.events.on('onError', (data) => {
  console.error(`Error: ${data.message}`);
});

client.events.on('onRetry', (data) => {
  console.warn(`Reintentando: intento ${data.attempt} de ${data.maxRetries}`);
});

client.events.on('onTimeout', (data) => {
  console.error(`Timeout después de ${data.timeout}ms`);
});
```

## Manejo de errores

```typescript
try {
  const response = await client.get<Usuario>('/usuarios/1');
} catch (error) {
  if (error.isTimeout) {
    console.error('La petición tardó demasiado');
  } else if (error.isNetworkError) {
    console.error('Error de red');
  } else {
    console.error(`Error del servidor: ${error.status}`);
  }
}
```

## Patrones de diseño y Programación Orientada a Aspectos

Fetchly aplica los siguientes patrones para mantener el código modular y desacoplado:

- **Facade**: `FetchlyClient` expone una interfaz simple (`get`, `post`, `put`, `patch`, `delete`) que oculta la complejidad interna de construir URLs, cabeceras, reintentos, timeouts y manejo de errores sobre `fetch`.
- **Observer**: `FetchlyEventEmitter` permite suscribirse (`on`/`off`) a eventos del ciclo de vida de una petición (`onSuccess`, `onError`, `onRetry`, `onTimeout`) sin acoplar al cliente HTTP con la lógica de quien consume esos eventos.
- **Programación Orientada a Aspectos (AOP)**: las preocupaciones transversales (logging, medición de tiempo y validación de configuración) están separadas en funciones independientes (`loggingAspect`, `timingAspect`, `validationAspect`) que envuelven la ejecución de la petición por composición, en lugar de mezclarse con la lógica de negocio de `executeRequest`.

## Tecnologías

- TypeScript
- Jest
- GitFlow

## Licencia

MIT