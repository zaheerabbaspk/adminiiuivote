import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { VotingService } from '../../services/voting.service';
import { Candidate, Election } from '../../models/models';

@Component({
    selector: 'app-candidate-management',
    templateUrl: './candidate-management.page.html',
    standalone: true,
    imports: [CommonModule, IonicModule, ReactiveFormsModule]
})
export class CandidateManagementPage {
    private votingService = inject(VotingService);
    private fb = inject(FormBuilder);

    candidates = this.votingService.candidates;
    elections = this.votingService.elections;

    isModalOpen = false;
    editingCandidateId = signal<string | null>(null);

    candidateForm: FormGroup = this.fb.group({
        name: ['', [Validators.required]],
        position: ['', [Validators.required]],
        party: ['', [Validators.required]],
        electionId: ['', [Validators.required]],
        imageUrl: ['']
    });

    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                this.candidateForm.patchValue({
                    imageUrl: reader.result as string
                });
            };
            reader.readAsDataURL(file);
        }
    }

    triggerFileInput() {
        const fileInput = document.getElementById('candidateImageInput') as HTMLInputElement;
        fileInput?.click();
    }

    openAddModal() {
        this.editingCandidateId.set(null);
        this.candidateForm.reset();
        this.isModalOpen = true;
    }

    deleteCandidate(id: string) {
        if (confirm('Are you sure you want to remove this candidate?')) {
            this.votingService.deleteCandidate(id);
        }
    }

    saveCandidate() {
        if (this.candidateForm.valid) {
            const formValue = this.candidateForm.value;
            this.votingService.addCandidate(formValue);
            this.isModalOpen = false;
        }
    }

    getElectionName(id: string) {
        return this.elections().find(e => e.id === id)?.name || 'Unknown Election';
    }
}
