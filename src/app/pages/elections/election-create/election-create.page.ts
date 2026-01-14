import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { VotingService } from '../../../services/voting.service';

@Component({
    selector: 'app-election-create',
    templateUrl: './election-create.page.html',
    standalone: true,
    imports: [CommonModule, IonicModule, ReactiveFormsModule, FormsModule, RouterLink]
})
export class ElectionCreatePage implements OnInit {
    private fb = inject(FormBuilder);
    private votingService = inject(VotingService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    electionId: string | null = null;
    isEditMode = false;

    // Position management
    positions: string[] = [];
    newPositionInput: string = '';

    // Candidate tracking for positions
    positionCandidates: { [position: string]: string[] } = {};

    // All candidates for selection
    candidates = this.votingService.candidates;

    electionForm: FormGroup = this.fb.group({
        name: ['', [Validators.required, Validators.minLength(3)]],
        description: [''],
        startDate: ['', [Validators.required]],
        endDate: ['', [Validators.required]],
        status: ['Draft', [Validators.required]]
    }, { validators: this.dateRangeValidator });

    ngOnInit() {
        this.electionId = this.route.snapshot.paramMap.get('id');
        if (this.electionId) {
            this.isEditMode = true;
            this.loadElection(this.electionId);
        }
    }

    loadElection(id: string) {
        const elections = this.votingService.elections();
        const election = elections.find(e => e.id === id);

        if (election) {
            this.electionForm.patchValue({
                name: election.name,
                description: election.description,
                startDate: election.startDate,
                endDate: election.endDate,
                status: election.status
            });

            // Load positions if they exist
            if (election.positions) {
                this.positions = [...election.positions];
            }
        }
    }

    dateRangeValidator(group: FormGroup) {
        const start = group.get('startDate')?.value;
        const end = group.get('endDate')?.value;
        return start && end && new Date(start) < new Date(end) ? null : { dateError: true };
    }

    addPosition() {
        const position = this.newPositionInput.trim();
        if (position && !this.positions.includes(position)) {
            this.positions.push(position);
            this.positionCandidates[position] = [];
            this.newPositionInput = '';
        }
    }

    removePosition(position: string) {
        this.positions = this.positions.filter(p => p !== position);
        delete this.positionCandidates[position];
    }

    async onSubmit() {
        console.log('Submitting election form:', this.electionForm.value);
        if (this.electionForm.valid) {
            try {
                const electionData = {
                    ...this.electionForm.value,
                    positions: this.positions
                };

                if (this.isEditMode && this.electionId) {
                    await this.votingService.updateElection(this.electionId, electionData);
                    console.log('Election updated successfully, navigating...');
                } else {
                    await this.votingService.addElection(electionData);
                    console.log('Election added successfully, navigating...');
                }
                this.router.navigate(['/admin/elections']);
            } catch (error) {
                console.error('Submission failed:', error);
                alert('Could not save election. Please check the backend.');
            }
        } else {
            console.warn('Form is invalid:', this.electionForm.errors);
            this.markFormGroupTouched(this.electionForm);
        }
    }

    private markFormGroupTouched(formGroup: FormGroup) {
        Object.values(formGroup.controls).forEach(control => {
            control.markAsTouched();
            if ((control as any).controls) {
                this.markFormGroupTouched(control as FormGroup);
            }
        });
    }
}
