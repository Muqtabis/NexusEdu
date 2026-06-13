import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private csrfTokens: Map<string, string> = new Map();

  use(req: Request, res: Response, next: NextFunction) {
    // Skip CSRF for GET requests
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
      return next();
    }

    // Skip CSRF for public endpoints (login, register)
    if (req.path === '/login' || req.path === '/register') {
      return next();
    }

    const csrfToken = req.header('X-CSRF-Token');
    const csrfCookie = req.header('X-CSRF-Cookie');

    if (!csrfToken || !csrfCookie || csrfToken !== csrfCookie) {
      throw new HttpException(
        'CSRF validation failed',
        HttpStatus.FORBIDDEN,
      );
    }

    next();
  }

  generateToken(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }
}
