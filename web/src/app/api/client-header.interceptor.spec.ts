import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CLIENT_HEADER, CLIENT_VALUE, clientHeaderInterceptor } from './client-header.interceptor';

describe('clientHeaderInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([clientHeaderInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('adds the client header to API requests', () => {
    http.put('/api/sessions/abc', {}).subscribe();
    const req = backend.expectOne('/api/sessions/abc');
    expect(req.request.headers.get(CLIENT_HEADER)).toBe(CLIENT_VALUE);
    req.flush({});
  });

  it('leaves other requests unchanged', () => {
    http.get('/assets/x.json').subscribe();
    const req = backend.expectOne('/assets/x.json');
    expect(req.request.headers.has(CLIENT_HEADER)).toBe(false);
    req.flush({});
  });
});
