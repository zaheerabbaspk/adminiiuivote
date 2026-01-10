import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { VotingService } from '../../services/voting.service';
import { Election } from '../../models/models';

@Component({
    selector: 'app-voting-control',
    templateUrl: './voting-control.page.html',
    standalone: true,
    imports: [CommonModule, IonicModule]
})
export class VotingControlPage {
    private votingService = inject(VotingService);
    private alertCtrl = inject(AlertController);

    elections = this.votingService.elections;

    async updateStatus(election: Election, newStatus: Election['status']) {
        const alert = await this.alertCtrl.create({
            header: 'Confirm Action',
            message: `Are you sure you want to change the status of "${election.name}" to ${newStatus}?`,
            buttons: [
                { text: 'Cancel', role: 'cancel' },
                {
                    text: 'Confirm',
                    handler: () => {
                        this.votingService.updateElectionStatus(election.id, newStatus);
                    }
                }
            ]
        });

        await alert.present();
    }

    getStatusIcon(status: Election['status']) {
        switch (status) {
            case 'Draft': return 'document-text-outline';
            case 'Active': return 'play-circle-outline';
            case 'Paused': return 'pause-circle-outline';
            case 'Ended': return 'stop-circle-outline';
            default: return 'help-circle-outline';
        }
    }

    getStatusColorClass(status: Election['status']) {
        switch (status) {
            case 'Draft': return 'text-slate-400 bg-slate-50 border-slate-100';
            case 'Active': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
            case 'Paused': return 'text-amber-500 bg-amber-50 border-amber-100';
            case 'Ended': return 'text-rose-500 bg-rose-50 border-rose-100';
            default: return 'text-slate-400';
        }
    }
}
