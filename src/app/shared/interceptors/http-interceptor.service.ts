import {inject, Injectable} from '@angular/core';
import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from "@angular/common/http";
import {catchError, EMPTY, Observable, throwError} from "rxjs";
import {Router} from "@angular/router";
import {AuthenticationService} from "../services/authentication.service";

@Injectable({
  providedIn: 'root'
})
export class HttpInterceptorService implements HttpInterceptor {

  router = inject(Router);
  auth = inject(AuthenticationService);

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // except for /login endpoint
    if (request.url.includes('/login')) {
      return next.handle(request);
    }

    const token = this.auth.getBearerToken();

    if (!token) {
      this.router.navigate(['login']).then(null);
      return EMPTY;
    }

    request = request.clone({
      setHeaders: {
        Authorization: token
      }
    });

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        switch (error.status) {
          case 401:
            return this.handle401();
          default:
            return throwError(() => error);
        }
      })
    );
  }

  private handle401() {
    this.auth.logout();
    return EMPTY;
  }
}
