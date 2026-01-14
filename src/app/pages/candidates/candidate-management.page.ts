import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { VotingService } from '../../services/voting.service';
import { Candidate, Election } from '../../models/models';
import { SafeUrlPipe } from '../../pipes/safe-url.pipe';

@Component({
    selector: 'app-candidate-management',
    templateUrl: './candidate-management.page.html',
    standalone: true,
    imports: [CommonModule, IonicModule, ReactiveFormsModule, SafeUrlPipe]
})
export class CandidateManagementPage {
    private votingService = inject(VotingService);
    private fb = inject(FormBuilder);

    candidates = this.votingService.candidates;
    elections = this.votingService.elections;

    // Available positions based on selected election
    availablePositions = signal<string[]>([]);

    isModalOpen = false;
    editingCandidateId = signal<string | null>(null);

    candidateForm: FormGroup = this.fb.group({
        name: ['', [Validators.required]],
        position: ['', [Validators.required]],
        party: ['', [Validators.required]],
        electionId: ['', [Validators.required]],
        imageUrl: ['']
    });

    constructor() {
        // Watch for election selection changes
        this.candidateForm.get('electionId')?.valueChanges.subscribe(async (electionId) => {
            if (electionId) {
                await this.loadPositionsForElection(electionId);
                // Reset position selection when election changes
                this.candidateForm.patchValue({ position: '' });
            } else {
                this.availablePositions.set([]);
            }
        });
    }

    async loadPositionsForElection(electionId: string) {
        const positions = await this.votingService.getElectionPositions(electionId);
        this.availablePositions.set(positions);
    }

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
        this.availablePositions.set([]);
        this.isModalOpen = true;
    }

    deleteCandidate(id: string) {
        if (confirm('Are you sure you want to remove this candidate?')) {
            this.votingService.deleteCandidate(id);
        }
    }

    async saveCandidate() {
        if (this.candidateForm.valid) {
            const formValue = this.candidateForm.value;
            console.log('Form Submit - Data Lengths:', {
                name: formValue.name.length,
                imageUrl: formValue.imageUrl ? formValue.imageUrl.length : 0
            });

            try {
                await this.votingService.addCandidate(formValue);
                this.isModalOpen = false;
            } catch (error) {
                console.error('Failed to save candidate:', error);
                alert('Error saving candidate. check console.');
            }
        } else {
            console.warn('Candidate form is invalid:', this.candidateForm.errors);
        }
    }

    getElectionName(id: string) {
        return this.elections().find(e => e.id === id)?.name || 'Unknown Election';
    }
}
