import { HttpInterceptorFn } from '@angular/common/http';

// The API rejects writes without this header (see api/app/security.py).
export const CLIENT_HEADER = 'X-Client';
export const CLIENT_VALUE = 'platform-web';

export const clientHeaderInterceptor: HttpInterceptorFn = (req, next) =>
  next(req.url.startsWith('/api/') ? req.clone({ setHeaders: { [CLIENT_HEADER]: CLIENT_VALUE } }) : req);
