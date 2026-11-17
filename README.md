# Práctica 6 · Integrar un agente en un aplicativo web

La Práctica 5 conectaba un agente de terminal a OpenRouter con el SDK de OpenAI. Esta práctica usa la misma integración desde un servidor Express. El navegador conserva en memoria los últimos diez intercambios y los envía con cada mensaje para mantener el contexto.

## Ejecutar en Windows

Desde la carpeta del proyecto, abre PowerShell y ejecuta:

```powershell
cd ai-backend
npm.cmd ci
Copy-Item .env.example .env
notepad .env
```

Agrega tu clave de OpenRouter en `OPENROUTER_API_KEY`, guarda el archivo y ejecuta `npm.cmd start`. Puedes usar tu clave de OpenRouter de la Práctica 5. El archivo `.env` se queda en el backend y está excluido de Git. El modelo inicial es `openai/gpt-4o-mini`.

Abre `ai-frontend/index.html` con doble clic o visita http://127.0.0.1:3000. Si cambias `PORT`, usa la dirección que imprime el servidor.

## Comprobar el contexto

1. Escribe «Me llamo Ana» y presiona Enter.
2. Escribe «¿Cómo me llamo?» y presiona Enviar. La respuesta debe recuperar el nombre del mensaje anterior.
3. Pulsa «Nueva conversación» para borrar los mensajes y su contexto.

El servidor expone `POST /api/chat`. Recibe `{ message, history }` y devuelve `{ reply }`. La Práctica 6 solicita un chat de texto, con los mensajes del usuario en azul a la derecha y los del agente en gris a la izquierda.
