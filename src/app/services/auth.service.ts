
import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { environment } from '../../environments/environment';

export interface User {
    id: number;
    username: string;
    token: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);
    private alertCtrl = inject(AlertController);
    private apiUrl = environment.apiUrl;

    currentUser = signal<User | null>(this.getUserFromStorage());

    constructor() { }

    private getUserFromStorage(): User | null {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    async showTokenPrompt() {
        const alert = await this.alertCtrl.create({
            header: 'Access Token Required',
            message: 'Please enter your administrator access token to connect to the backend.',
            backdropDismiss: false,
            inputs: [
                {
                    name: 'token',
                    type: 'text',
                    placeholder: 'Enter access token...'
                }
            ],
            buttons: [
                {
                    text: 'Connect',
                    handler: (data) => {
                        if (data.token) {
                            this.setToken(data.token);
                            return true;
                        }
                        return false;
                    }
                }
            ]
        });

        await alert.present();
    }

    setToken(token: string) {
        const user: User = {
            id: 1,
            username: 'Admin',
            token: token
        };
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUser.set(user);

        // Refresh page to re-initialize services with the new token
        window.location.reload();
    }

    logout() {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        this.currentUser.set(null);
        this.showTokenPrompt();
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }
}
