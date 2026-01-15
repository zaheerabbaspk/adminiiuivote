import { Component, OnInit, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { VotingService } from '../../services/voting.service';
import { Election, TokenBatch } from '../../models/models';

@Component({
    selector: 'app-tokens',
    templateUrl: './tokens.page.html',
    standalone: true,
    imports: [CommonModule, FormsModule, IonicModule]
})
export class TokensPage implements OnInit {
    private votingService = inject(VotingService);
    private eRef = inject(ElementRef);

    availableElections = this.votingService.elections;
    tokenBatches = this.votingService.tokenBatches;

    selectedElections: Election[] = [];
    tokenCount = 0;
    selectedGroup: TokenBatch | null = null;

    isElectionDropdownOpen = false;

    async ngOnInit() {
        await this.votingService.getTokenBatches();
    }

    @HostListener('document:click', ['$event'])
    clickout(event: any) {
        // Find the election selector container specifically
        const selectorContainer = this.eRef.nativeElement.querySelector('.election-selector-container');
        if (selectorContainer && !selectorContainer.contains(event.target)) {
            this.isElectionDropdownOpen = false;
        }
    }

    toggleElection(election: Election) {
        const index = this.selectedElections.findIndex(e => e.id === election.id);
        if (index === -1) {
            this.selectedElections.push(election);
        } else {
            this.selectedElections.splice(index, 1);
        }
    }

    selectAll() {
        if (this.selectedElections.length === this.availableElections().length) {
            this.selectedElections = [];
        } else {
            this.selectedElections = [...this.availableElections()];
        }
    }

    removeElection(election: Election) {
        this.selectedElections = this.selectedElections.filter(e => e.id !== election.id);
    }

    isSelected(election: Election): boolean {
        return this.selectedElections.some(e => e.id === election.id);
    }

    async generateTokens() {
        if (this.selectedElections.length === 0 || this.tokenCount <= 0) {
            return;
        }

        try {
            const electionIds = this.selectedElections.map(e => e.id);
            await this.votingService.generateTokens(electionIds, this.tokenCount);

            // Reset form
            this.selectedElections = [];
            this.tokenCount = 0;
            this.isElectionDropdownOpen = false;

            // Optionally select the latest batch
            const batches = this.tokenBatches();
            if (batches.length > 0) {
                this.selectedGroup = batches[0];
            }
        } catch (error) {
            console.error('Failed to generate tokens:', error);
        }
    }

    deleteGroup(groupId: string, event?: Event) {
        if (event) event.stopPropagation();
        if (confirm('Are you sure you want to delete this entire batch? This action cannot be undone.')) {
            this.votingService.deleteBatch(groupId).then(() => {
                if (this.selectedGroup?.batchId === groupId) {
                    this.selectedGroup = null;
                }
            }).catch(err => {
                alert('Failed to delete batch. Please try again.');
            });
        }
    }

    async deleteSingleToken(tokenId: number) {
        if (confirm('Delete this token?')) {
            try {
                await this.votingService.deleteToken(tokenId);
                // Update local selectedGroup reference if it's the one we're viewing
                if (this.selectedGroup) {
                    this.selectedGroup.tokens = this.selectedGroup.tokens.filter((t: any) => t.id !== tokenId);
                }
            } catch (error) {
                alert('Failed to delete token.');
            }
        }
    }

    viewGroup(group: TokenBatch) {
        this.selectedGroup = group;
    }

    closeDetail() {
        this.selectedGroup = null;
    }

    copyGroupTokens(tokens: any[], event?: Event) {
        if (event) event.stopPropagation();
        const tokenText = tokens.map(t => typeof t === 'string' ? t : t.token).join('\n');
        navigator.clipboard.writeText(tokenText);
    }

    copySingleToken(token: string) {
        navigator.clipboard.writeText(token);
    }
}
