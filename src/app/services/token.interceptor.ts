import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(private apiService: ApiService) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (this.shouldSkipTokenInterceptor(request)) {
      return next.handle(request);
    }
    // add authorization header with jwt token if available
    let currentUser = this.apiService.currentUserValue;
    console.log(this.apiService.currentUserValue);
    let token = currentUser?.token ?? currentUser?.session.access_token;
    if (
      currentUser &&
      token &&
      request.url.includes(this.apiService.portal_url) &&
      !request.url.includes('/auth')
    ) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });

      // this.apiService.globalloading=true;
    }

    return next.handle(request);
  }

  private shouldSkipTokenInterceptor(request: HttpRequest<any>): boolean {
    // Add logic to skip token interceptor for specific routes
    // For example, you can check the request URL or other criteria
    return request.url.includes('/auth');
  }
}
