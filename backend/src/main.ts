import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { IncomingMessage, ServerResponse } from 'http';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';

function isPrivateHost(hostname: string): boolean {
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '0.0.0.0'
  ) {
    return true;
  }

  const parts = hostname.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return false;
  }

  const first = parts[0]!;
  const second = parts[1]!;

  return (
    first === 10 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 169 && second === 254)
  );
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const corsOrigin = config.get<string>('CORS_ORIGIN');
  const nodeEnv = config.get<string>('NODE_ENV') ?? 'development';

  app.use(
    helmet({
      crossOriginResourcePolicy: nodeEnv === 'production' ? undefined : false,
    }),
  );

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      try {
        const url = new URL(origin);
        if (nodeEnv !== 'production' && isPrivateHost(url.hostname)) {
          callback(null, true);
          return;
        }

        const allowed = corsOrigin ? corsOrigin.split(',').map((o) => o.trim()) : [];
        const isAllowed = allowed.some((a) => {
          try {
            const allowedUrl = new URL(a);
            return allowedUrl.origin === url.origin;
          } catch {
            console.warn(`[CORS] Failed to parse allowed origin: ${a}`);
            return a === origin;
          }
        });

        if (isAllowed) {
          callback(null, true);
          return;
        }

        callback(null, false);
      } catch {
        console.warn(`[CORS] Failed to parse request origin: ${origin}`);
        callback(null, false);
      }
    },
    credentials: true,
  });
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.use(
    (
      req: IncomingMessage & { method: string; originalUrl: string },
      res: ServerResponse,
      next: () => void,
    ) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
      });
      next();
    },
  );

  await app.listen(config.get<number>('PORT') ?? 4000, config.get<string>('HOST') ?? '0.0.0.0');
}

void bootstrap();
