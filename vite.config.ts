import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import worker from './worker/index.ts';
import { createD1Emulator } from './worker/db-emulator.ts';

function cloudflareWorkerDevPlugin(): Plugin {
  const devEnv = {
    DB: createD1Emulator(),
    ENVIRONMENT: 'development',
    BOOTSTRAP_SECRET: process.env.BOOTSTRAP_SECRET || 'starter-secret-2026'
  };

  return {
    name: 'cloudflare-worker-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api')) {
          return next();
        }

        try {
          const protocol = req.headers['x-forwarded-proto'] || 'http';
          const host = req.headers.host || 'localhost:3000';
          const fullUrl = `${protocol}://${host}${req.url}`;

          let body: Uint8Array | null = null;
          if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method || '')) {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(chunk);
            }
            body = Buffer.concat(chunks);
          }

          const headers = new Headers();
          for (const [k, v] of Object.entries(req.headers)) {
            if (v === undefined) continue;
            if (Array.isArray(v)) {
              for (const item of v) headers.append(k, item);
            } else {
              headers.set(k, v);
            }
          }

          const webRequest = new Request(fullUrl, {
            method: req.method,
            headers,
            body: body && body.length > 0 ? (body as any) : undefined,
            // @ts-ignore
            duplex: 'half'
          });

          const webResponse = await worker.fetch(webRequest, devEnv, {});

          res.statusCode = webResponse.status;
          webResponse.headers.forEach((val, key) => {
            if (key.toLowerCase() === 'set-cookie') {
              const current = res.getHeader('Set-Cookie');
              if (current) {
                const arr = Array.isArray(current) ? current : [String(current)];
                res.setHeader('Set-Cookie', [...arr, val]);
              } else {
                res.setHeader('Set-Cookie', val);
              }
            } else {
              res.setHeader(key, val);
            }
          });

          if (webResponse.body) {
            const arrayBuf = await webResponse.arrayBuffer();
            res.end(Buffer.from(arrayBuf));
          } else {
            res.end();
          }
        } catch (err) {
          console.error('Worker Dev Middleware Error:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Worker Dev Middleware Error', details: String(err) }));
        }
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), cloudflareWorkerDevPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

