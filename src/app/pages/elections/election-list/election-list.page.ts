import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { VotingService } from '../../../services/voting.service';
import { Election } from '../../../models/models';

@Component({
    selector: 'app-election-list',
    templateUrl: './election-list.page.html',
    standalone: true,
    imports: [CommonModule, IonicModule, RouterLink]
})
export class ElectionListPage {
    votingService = inject(VotingService);
    elections = this.votingService.elections;

    getStatusBadgeClass(status: Election['status']) {
        switch (status) {
            case 'Draft': return 'bg-slate-100 text-slate-600 border-slate-200';
            case 'Active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Paused': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Ended': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-slate-100 text-slate-600';
        }
    }
}
