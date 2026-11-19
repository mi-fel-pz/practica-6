const path = require('node:path');
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const { chat } = require('./agent');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const apiKey = process.env.OPENROUTER_API_KEY?.trim();
const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
const openrouter = apiKey && new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey,
  timeout: 60000,
  maxRetries: 0,
});

const app = express();
app.use(cors({ origin: 'null' }));
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, '../ai-frontend')));

app.post('/api/chat', async (req, res) => {
  const { message, history = [] } = req.body || {};
  if (typeof message !== 'string' || !message.trim() || message.length > 4000) {
    return res.status(400).json({ error: 'Escribe un mensaje de hasta 4000 caracteres.' });
  }

  if (!Array.isArray(history) || history.length > 20 || history.some(turn =>
    !turn || !['user', 'assistant'].includes(turn.role) ||
    typeof turn.content !== 'string' || !turn.content.trim() || turn.content.length > 16000
  )) {
    return res.status(400).json({ error: 'El historial de la conversación no es válido.' });
  }

  if (!openrouter) {
    return res.status(503).json({ error: 'Configura OPENROUTER_API_KEY en ai-backend/.env y reinicia el servidor.' });
  }

  try {
    const result = await chat(openrouter, model, message.trim(), history);
    return res.json(result);
  } catch (error) {
    console.error('Error de OpenRouter:', error.status || error.name);
    const errors = {
      401: 'OpenRouter rechazó la clave. Revísala en ai-backend/.env.',
      402: 'Revisa el saldo de tu cuenta de OpenRouter.',
      404: 'El modelo configurado no está disponible en OpenRouter.',
      429: 'OpenRouter recibió demasiadas solicitudes. Intenta en unos momentos.',
    };
    return res.status(502).json({ error: errors[error.status] || 'No se pudo obtener una respuesta de OpenRouter.' });
  }
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición debe ser JSON válido.' });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'La petición supera el tamaño permitido.' });
  }
  console.error('Error del servidor:', error.name);
  return res.status(500).json({ error: 'Ocurrió un error en el servidor.' });
});

const port = Number(process.env.PORT || 3001);
app.listen(port, '127.0.0.1', error => {
  if (error) {
    console.error(`No se pudo iniciar el chat en el puerto ${port}: ${error.code || error.message}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Chat disponible en http://127.0.0.1:${port}`);
});
