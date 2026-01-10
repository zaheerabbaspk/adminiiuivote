import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive, IonicModule]
})
export class SidebarComponent {
    navItems = [
        { label: 'Dashboard', icon: 'grid-outline', route: '/admin/dashboard' },
        { label: 'Elections', icon: 'list-outline', route: '/admin/elections' },
        { label: 'Candidates', icon: 'people-outline', route: '/admin/candidates' },
        { label: 'Voters', icon: 'person-add-outline', route: '/admin/voters' },
        { label: 'Voting Control', icon: 'settings-outline', route: '/admin/voting-control' },
        { label: 'Results', icon: 'stats-chart-outline', route: '/admin/results' },
        { label: 'Audit Logs', icon: 'journal-outline', route: '/admin/audit-logs' },
    ];
}
