import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive, IonicModule]
})
export class SidebarComponent {
    authService = inject(AuthService);

    navItems = [
        { label: 'Dashboard', icon: 'grid-outline', route: '/admin/dashboard' },
        { label: 'Elections', icon: 'list-outline', route: '/admin/elections' },
        { label: 'Candidates', icon: 'people-outline', route: '/admin/candidates' },
        { label: 'Voters', icon: 'person-add-outline', route: '/admin/voters' },
        { label: 'Voting Control', icon: 'settings-outline', route: '/admin/voting-control' },
        { label: 'Results', icon: 'stats-chart-outline', route: '/admin/results' },
        { label: 'Audit Logs', icon: 'journal-outline', route: '/admin/audit-logs' },
        { label: 'Access Tokens', icon: 'key-outline', route: '/admin/tokens' },
    ];
}
