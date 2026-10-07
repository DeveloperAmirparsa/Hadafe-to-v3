import { rm } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await rm('dist-server', { recursive: true, force: true });
