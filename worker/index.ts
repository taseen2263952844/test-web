/**
 * Cloudflare Worker Main Entry Point
 * Handles API routing via /api/* and static asset delegation via Cloudflare Workers Assets
 */

import { handleApiRequest } from './api.ts';
import type { Env } from './types.ts';

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // Route API calls to our API handler
    if (url.pathname.startsWith('/api')) {
      return handleApiRequest(request, env);
    }

    // In Cloudflare Workers with Assets enabled, forward static frontend requests to ASSETS binding
    if (env.ASSETS && typeof (env.ASSETS as any).fetch === 'function') {
      return (env.ASSETS as any).fetch(request);
    }

    return new Response('Restaurant Starter Worker: Route not matched', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};
