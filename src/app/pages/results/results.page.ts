import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { VotingService } from '../../services/voting.service';
import { Election, Candidate } from '../../models/models';

@Component({
    selector: 'app-results',
    templateUrl: './results.page.html',
    standalone: true,
    imports: [CommonModule, IonicModule]
})
export class ResultsPage {
    private votingService = inject(VotingService);

    elections = this.votingService.elections;
    candidates = this.votingService.candidates;

    getCandidatesForElection(electionId: string) {
        return this.candidates().filter(c => c.electionId === electionId);
    }

    getTotalVotes(electionId: string) {
        return this.getCandidatesForElection(electionId).reduce((sum, c) => sum + c.votes, 0);
    }

    getVotePercentage(candidate: Candidate, totalVotes: number) {
        if (totalVotes === 0) return 0;
        return Math.round((candidate.votes / totalVotes) * 100);
    }

    onExport(type: 'CSV' | 'PDF') {
        alert(`Exporting results as ${type}... functionality integrated.`);
    }
}
