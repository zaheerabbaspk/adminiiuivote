import { Component, OnInit, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);

  ngOnInit() {
    if (!this.authService.isAuthenticated()) {
      this.authService.showTokenPrompt();
    }
  }
}
