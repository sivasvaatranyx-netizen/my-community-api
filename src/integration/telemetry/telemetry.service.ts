import { Injectable } from '@nestjs/common';

interface RouteStat {
  count: number;
  totalMs: number;
  errors: number;
}

/** In-process metrics. Swap for Cloud Monitoring / OpenTelemetry exporters in production. */
@Injectable()
export class TelemetryService {
  private readonly startedAt = Date.now();
  private readonly counters = new Map<string, number>();
  private readonly routes = new Map<string, RouteStat>();

  increment(name: string, by = 1): void {
    this.counters.set(name, (this.counters.get(name) ?? 0) + by);
  }

  recordRequest(method: string, route: string, status: number, durationMs: number): void {
    const key = `${method} ${route}`;
    const stat = this.routes.get(key) ?? { count: 0, totalMs: 0, errors: 0 };
    stat.count += 1;
    stat.totalMs += durationMs;
    if (status >= 500) stat.errors += 1;
    this.routes.set(key, stat);
    this.increment('http.requests');
    if (status >= 400) this.increment(status >= 500 ? 'http.5xx' : 'http.4xx');
  }

  snapshot() {
    return {
      uptimeSeconds: Math.round((Date.now() - this.startedAt) / 1000),
      memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      counters: Object.fromEntries(this.counters),
      routes: [...this.routes.entries()]
        .map(([route, s]) => ({
          route,
          count: s.count,
          avgMs: Math.round((s.totalMs / s.count) * 100) / 100,
          errors: s.errors,
        }))
        .sort((a, b) => b.count - a.count),
    };
  }
}
