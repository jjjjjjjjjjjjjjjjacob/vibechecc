import { hydrateRoot } from 'react-dom/client';
import { StartClient } from '@tanstack/react-start';
import { createRouter } from './router';
// Ensure Tailwind CSS participates in Vite HMR on the client
import '@/styles/app.css';

const router = createRouter();

hydrateRoot(document, <StartClient router={router} />);
