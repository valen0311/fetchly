import { FetchlyClient } from './src/core/index';

// Interfaz de ejemplo para tipar las respuestas
interface Usuario {
  id: number;
  name: string;
  email: string;
}

interface NuevoUsuario {
  name: string;
  email: string;
}

// Crear una instancia del cliente con configuración global
const client = new FetchlyClient({
  baseUrl: 'https://jsonplaceholder.typicode.com',
  timeout: 5000,
  retries: 2,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Suscribirse a eventos
client.events.on('onSuccess', (data) => {
  console.log(`✅ Petición exitosa: ${data.method} ${data.url} (${data.duration.toFixed(2)}ms)`);
});

client.events.on('onError', (data) => {
  console.error(`❌ Error en petición: ${data.method} ${data.url} - ${data.message}`);
});

client.events.on('onRetry', (data) => {
  console.warn(`🔄 Reintentando: ${data.method} ${data.url} (intento ${data.attempt} de ${data.maxRetries})`);
});

client.events.on('onTimeout', (data) => {
  console.error(`⏱️ Timeout: ${data.method} ${data.url} superó ${data.timeout}ms`);
});

// Ejemplo con async/await
async function ejemploAsyncAwait(): Promise<void> {
  console.log('\n--- Ejemplo con async/await ---');

  // GET
  const usuarios = await client.get<Usuario[]>('/users');
  console.log(`Usuarios obtenidos: ${usuarios.data.length}`);

  // GET por ID
  const usuario = await client.get<Usuario>('/users/1');
  console.log(`Usuario: ${usuario.data.name} - ${usuario.data.email}`);

  // POST
  const nuevoUsuario: NuevoUsuario = { name: 'Valentina', email: 'valen@ejemplo.com' };
  const creado = await client.post<Usuario>('/users', nuevoUsuario);
  console.log(`Usuario creado con ID: ${creado.data.id}`);

  // PUT
  const actualizado = await client.put<Usuario>('/users/1', { name: 'Valentina Actualizada', email: 'valen@ejemplo.com' });
  console.log(`Usuario actualizado: ${actualizado.data.name}`);

  // PATCH
  const parcial = await client.patch<Usuario>('/users/1', { name: 'Valen' });
  console.log(`Usuario modificado: ${parcial.data.name}`);

  // DELETE
  const eliminado = await client.delete('/users/1');
  console.log(`Usuario eliminado, status: ${eliminado.status}`);
}

// Ejemplo con Promises
function ejemploPromesas(): void {
  console.log('\n--- Ejemplo con Promises ---');

  client.get<Usuario>('/users/2')
    .then((response) => {
      console.log(`Usuario obtenido con Promise: ${response.data.name}`);
    })
    .catch((error) => {
      console.error(`Error: ${error.message}`);
    });
}

// Ejecutar ejemplos
ejemploAsyncAwait()
  .then(() => ejemploPromesas())
  .catch(console.error);