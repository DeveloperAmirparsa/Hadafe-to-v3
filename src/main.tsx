import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Ensure all /api requests automatically carry the session Bearer token and credentials in iframes
const originalFetch = window.fetch.bind(window);
window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  if (typeof url === 'string' && (url.startsWith('/api') || url.includes('/api/'))) {
    const token = window.localStorage.getItem('hadafeto:token');
    const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return originalFetch(input, {
      ...init,
      headers,
      credentials: init?.credentials ?? 'same-origin',
    });
  }
  return originalFetch(input, init);
};

createRoot(document.getElementById('root')!).render(<App />);
