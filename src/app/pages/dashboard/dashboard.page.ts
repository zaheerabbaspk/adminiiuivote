import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { VotingService } from '../../services/voting.service';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.page.html',
    standalone: true,
    imports: [CommonModule, IonicModule]
})
export class DashboardPage {
    votingService = inject(VotingService);
    stats = this.votingService.stats;
    recentLogs = this.votingService.auditLogs;
}
