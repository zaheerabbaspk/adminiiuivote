import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

interface Election {
    id: string;
    title: string;
}

interface TokenGroup {
    id: string;
    timestamp: Date;
    elections: Election[];
    tokens: string[];
}

@Component({
    selector: 'app-tokens',
    templateUrl: './tokens.page.html',
    standalone: true,
    imports: [CommonModule, FormsModule, IonicModule]
})
export class TokensPage implements OnInit {
    availableElections: Election[] = [
        { id: '1', title: 'Library President' },
        { id: '2', title: 'Sports President' },
        { id: '3', title: 'Societies Lead' },
        { id: '4', title: 'Batch Representative' }
    ];

    selectedElections: Election[] = [];
    tokenCount = 0;
    tokenGroups: TokenGroup[] = [];
    selectedGroup: TokenGroup | null = null;

    isElectionDropdownOpen = false;

    constructor(private eRef: ElementRef) { }

    ngOnInit() { }

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

    removeElection(election: Election) {
        this.selectedElections = this.selectedElections.filter(e => e.id !== election.id);
    }

    isSelected(election: Election): boolean {
        return this.selectedElections.some(e => e.id === election.id);
    }

    generateTokens() {
        if (this.selectedElections.length === 0 || this.tokenCount <= 0) {
            return;
        }

        const newTokens: string[] = [];
        for (let i = 0; i < this.tokenCount; i++) {
            const token = Math.floor(100000 + Math.random() * 900000).toString();
            newTokens.push(token);
        }

        const newGroup: TokenGroup = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date(),
            elections: [...this.selectedElections],
            tokens: newTokens
        };

        this.tokenGroups.unshift(newGroup);
        this.selectedGroup = newGroup; // Automatically view the new group

        // Reset form
        this.selectedElections = [];
        this.tokenCount = 0;
        this.isElectionDropdownOpen = false;
    }

    deleteGroup(groupId: string, event?: Event) {
        if (event) event.stopPropagation();
        this.tokenGroups = this.tokenGroups.filter(g => g.id !== groupId);
        if (this.selectedGroup?.id === groupId) {
            this.selectedGroup = null;
        }
    }

    viewGroup(group: TokenGroup) {
        this.selectedGroup = group;
    }

    closeDetail() {
        this.selectedGroup = null;
    }

    copyGroupTokens(tokens: string[], event?: Event) {
        if (event) event.stopPropagation();
        const tokenText = tokens.join('\n');
        navigator.clipboard.writeText(tokenText);
    }

    copySingleToken(token: string) {
        navigator.clipboard.writeText(token);
    }
}
