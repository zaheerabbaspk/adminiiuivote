
import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export interface User {
    id: number;
    username: string;
    role?: string;
    token?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);
    private apiUrl = environment.apiUrl;

    currentUser = signal<User | null>(this.getUserFromStorage());

    constructor() { }

    private getUserFromStorage(): User | null {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    async login(username: string, password: string): Promise<boolean> {
        try {
            console.log('Attempting login for:', username);
            // Updated to expect a token as per new requirements
            const response = await firstValueFrom(this.http.post<any>(`${this.apiUrl}/login`, { username, password }));
            console.log('Login Response:', response);

            if (response) {
                // Determine role - default to admin if not provided for this specific UI requirement since it's an admin panel
                // In a real scenario, the backend return the role.
                const user: User = {
                    id: response.user_id,
                    username: username,
                    token: response.access_token || response.token, // Handle both standard FastAPI OAuth2 and custom
                    role: response.role || 'admin'
                };

                if (user.token) {
                    localStorage.setItem('token', user.token);
                }

                localStorage.setItem('user', JSON.stringify(user));
                this.currentUser.set(user);
                return true;
            }
            return false;
        } catch (error: any) {
            console.error('Login failed full error:', error);
            if (error.status === 0) {
                console.error('Connection refused - is the backend running directly on port 8000?');
            }
            throw error;
        }
    }

    logout() {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        this.currentUser.set(null);
        this.router.navigate(['/login']);
    }

    isAuthenticated(): boolean {
        return !!this.currentUser();
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }
}
