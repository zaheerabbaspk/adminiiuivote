import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

interface Candidate {
    id: string;
    name: string;
    party: string;
    image?: string;
}

interface VotingElection {
    id: string;
    title: string;
    candidates: Candidate[];
    selectedCandidateId?: string;
    voted: boolean;
}

@Component({
    selector: 'app-voting-ui',
    templateUrl: './voting-ui.page.html',
    standalone: true,
    imports: [CommonModule, FormsModule, IonicModule]
})
export class VotingUiPage implements OnInit {
    step: 'entry' | 'elections' | 'voting' | 'success' = 'entry';
    voterToken = '';

    elections: VotingElection[] = [
        {
            id: '1',
            title: 'Library President',
            voted: false,
            candidates: [
                { id: '101', name: 'Ahmed Ali', party: 'Visionary Group' },
                { id: '102', name: 'Sara Khan', party: 'Progressive Alliance' }
            ]
        },
        {
            id: '2',
            title: 'Sports President',
            voted: false,
            candidates: [
                { id: '201', name: 'Zaid Malik', party: 'Athletes United' },
                { id: '202', name: 'Omar Farooq', party: 'Sports First' }
            ]
        }
    ];

    activeElectionIndex = 0;

    constructor() { }

    ngOnInit() { }

    verifyToken() {
        if (this.voterToken.length === 6) {
            this.step = 'elections';
        }
    }

    startVoting() {
        this.step = 'voting';
        this.activeElectionIndex = 0;
    }

    selectCandidate(candidateId: string) {
        this.elections[this.activeElectionIndex].selectedCandidateId = candidateId;
    }

    nextElection() {
        this.elections[this.activeElectionIndex].voted = true;
        if (this.activeElectionIndex < this.elections.length - 1) {
            this.activeElectionIndex++;
        } else {
            this.step = 'success';
        }
    }

    get currentElection() {
        return this.elections[this.activeElectionIndex];
    }

    get allVoted() {
        return this.elections.every(e => e.selectedCandidateId);
    }
}
