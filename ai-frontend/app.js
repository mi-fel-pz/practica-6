const form = document.querySelector('#composer');
const input = document.querySelector('#message');
const messages = document.querySelector('#messages');
const statusMessage = document.querySelector('#status');
const send = document.querySelector('#send');
const reset = document.querySelector('#reset');
const api = location.protocol === 'file:' ? 'http://127.0.0.1:3000/api/chat' : '/api/chat';

let history = [];
let sending = false;

function appendMessage(content, role) {
  const message = document.createElement('p');
  message.classList.add('message', role);
  message.setAttribute('aria-label', role === 'user' ? 'Tú' : 'Agente');
  message.textContent = content;
  messages.append(message);
  messages.scrollTop = messages.scrollHeight;
  return message;
}

reset.addEventListener('click', () => {
  history = [];
  messages.replaceChildren();
  statusMessage.textContent = '';
  reset.disabled = true;
  input.focus();
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  const text = input.value.trim();
  if (sending || !text) return;

  sending = true;
  input.readOnly = true;
  send.disabled = true;
  reset.disabled = true;
  input.value = '';
  const pending = appendMessage(text, 'user');
  statusMessage.textContent = 'Esperando respuesta…';

  try {
    const response = await fetch(api, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history }),
    });
    const data = await response.json();
    if (!response.ok || !data.reply) {
      statusMessage.textContent = data.error || 'El servidor no devolvió una respuesta.';
      pending.remove();
      input.value = text;
      return;
    }

    appendMessage(data.reply, 'assistant');
    history = [
      ...history,
      { role: 'user', content: text },
      { role: 'assistant', content: data.reply.slice(0, 16000) },
    ].slice(-20);
    statusMessage.textContent = '';
  } catch {
    pending.remove();
    input.value = text;
    statusMessage.textContent = 'No se pudo conectar con el servidor del chat. Comprueba que esté en ejecución.';
  } finally {
    sending = false;
    input.readOnly = false;
    send.disabled = false;
    reset.disabled = history.length === 0;
    input.focus();
  }
});
