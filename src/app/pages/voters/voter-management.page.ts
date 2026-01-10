import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { VotingService } from '../../services/voting.service';
import { Voter, Election } from '../../models/models';

@Component({
    selector: 'app-voter-management',
    templateUrl: './voter-management.page.html',
    standalone: true,
    imports: [CommonModule, IonicModule, ReactiveFormsModule]
})
export class VoterManagementPage {
    private votingService = inject(VotingService);
    private fb = inject(FormBuilder);

    voters = this.votingService.voters;
    elections = this.votingService.elections;

    isModalOpen = false;

    voterForm: FormGroup = this.fb.group({
        name: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        electionId: ['', [Validators.required]]
    });

    toggleVoterStatus(id: string) {
        this.votingService.toggleVoterStatus(id);
    }

    addVoter() {
        if (this.voterForm.valid) {
            this.votingService.addVoter(this.voterForm.value);
            this.voterForm.reset();
            this.isModalOpen = false;
        }
    }

    getElectionName(id: string) {
        return this.elections().find(e => e.id === id)?.name || 'N/A';
    }

    onBulkUpload() {
        alert('CSV Upload functionality - Placeholder integrated for demonstration.');
    }
}
