import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { VotingService } from '../../../services/voting.service';

@Component({
    selector: 'app-election-create',
    templateUrl: './election-create.page.html',
    standalone: true,
    imports: [CommonModule, IonicModule, ReactiveFormsModule, RouterLink]
})
export class ElectionCreatePage {
    private fb = inject(FormBuilder);
    private votingService = inject(VotingService);
    private router = inject(Router);

    electionForm: FormGroup = this.fb.group({
        name: ['', [Validators.required, Validators.minLength(3)]],
        description: [''],
        startDate: ['', [Validators.required]],
        endDate: ['', [Validators.required]],
        status: ['Draft', [Validators.required]]
    }, { validators: this.dateRangeValidator });

    dateRangeValidator(group: FormGroup) {
        const start = group.get('startDate')?.value;
        const end = group.get('endDate')?.value;
        return start && end && new Date(start) < new Date(end) ? null : { dateError: true };
    }

    async onSubmit() {
        console.log('Submitting election form:', this.electionForm.value);
        if (this.electionForm.valid) {
            try {
                await this.votingService.addElection(this.electionForm.value);
                console.log('Election added successfully, navigating...');
                this.router.navigate(['/admin/elections']);
            } catch (error) {
                console.error('Submission failed:', error);
                alert('Could not create election. Please check the backend.');
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
