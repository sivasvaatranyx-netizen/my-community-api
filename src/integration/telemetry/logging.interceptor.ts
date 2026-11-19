import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { TelemetryService } from './telemetry.service';

/** Emits one structured JSON log line per request (Cloud Logging friendly) and feeds metrics. */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  constructor(private readonly telemetry: TelemetryService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();
    const started = Date.now();

    const finish = (status: number) => {
      const durationMs = Date.now() - started;
      const route = req.route?.path ?? req.url;
      this.telemetry.recordRequest(req.method, route, status, durationMs);
      this.logger.log(
        JSON.stringify({
          method: req.method,
          path: req.originalUrl ?? req.url,
          status,
          durationMs,
          userId: req.user?.id,
          role: req.user?.role,
        }),
      );
    };

    return next.handle().pipe(
      tap({
        next: () => finish(res.statusCode),
        error: (err) => finish(err?.status ?? 500),
      }),
    );
  }
}
