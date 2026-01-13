
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { VotingService } from '../../services/voting.service';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.page.html',
    standalone: true,
    imports: [CommonModule, IonicModule, RouterLink]
})
export class DashboardPage {
    public votingService = inject(VotingService);

    // Explicit signal aliases to help compiler if needed
    public stats = this.votingService.stats;
    public recentLogs = this.votingService.auditLogs;
    public error = this.votingService.error;
    public initialized = this.votingService.initialized;
}
