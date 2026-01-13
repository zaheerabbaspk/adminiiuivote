
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    // Break circular dependency (HttpClient -> Interceptor -> AuthService -> HttpClient)
    // by reading token directly from storage or using Injector (but storage is simpler here)
    const token = localStorage.getItem('token');

    if (token) {
        const cloned = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}` // Standard Bearer format
            }
        });
        return next(cloned);
    }

    return next(req);
};
