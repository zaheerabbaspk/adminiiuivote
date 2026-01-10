import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
    selector: 'app-admin-layout',
    templateUrl: './admin-layout.component.html',
    standalone: true,
    imports: [CommonModule, RouterOutlet, IonicModule, SidebarComponent]
})
export class AdminLayoutComponent { }
