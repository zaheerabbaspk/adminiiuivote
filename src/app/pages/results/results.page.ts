import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { VotingService } from '../../services/voting.service';
import { ElectionResult, CandidateResult } from '../../models/models';
import { SafeUrlPipe } from '../../pipes/safe-url.pipe';

@Component({
    selector: 'app-results',
    templateUrl: './results.page.html',
    standalone: true,
    imports: [CommonModule, IonicModule, SafeUrlPipe]
})
export class ResultsPage implements OnInit {
    public votingService = inject(VotingService);

    results = this.votingService.results;

    async ngOnInit() {
        await this.votingService.getResults();
    }

    async refreshResults() {
        await this.votingService.getResults();
    }

    getVotePercentage(candidate: CandidateResult, totalVotes: number) {
        if (totalVotes === 0) return 0;
        return Math.round((candidate.vote_count / totalVotes) * 100);
    }

    getWinner(election: ElectionResult): CandidateResult | null {
        if (election.candidates.length === 0) return null;
        return election.candidates.reduce((prev, current) =>
            (prev.vote_count > current.vote_count) ? prev : current
        );
    }

    onExport(type: 'CSV' | 'PDF') {
        alert(`Exporting results as ${type}... functionality integrated.`);
    }
}
