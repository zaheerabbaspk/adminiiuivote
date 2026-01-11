import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Election, ElectionStatus, Candidate, Voter, AuditLog, DashboardStats } from '../models/models';
import { firstValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class VotingService {
    private http = inject(HttpClient);
    private apiUrl = 'http://127.0.0.1:8000';

    // Signals for state
    private electionsSignal = signal<Election[]>([]);
    private candidatesSignal = signal<Candidate[]>([]);
    private votersSignal = signal<Voter[]>([]);
    private auditLogsSignal = signal<AuditLog[]>(this.loadFromStorage('auditLogs', []));

    // Public readonly signals
    readonly elections = this.electionsSignal.asReadonly();
    readonly candidates = this.candidatesSignal.asReadonly();
    readonly voters = this.votersSignal.asReadonly();
    readonly auditLogs = this.auditLogsSignal.asReadonly();

    // Computed signals
    readonly stats = computed<DashboardStats>(() => ({
        totalVoters: this.votersSignal().length,
        totalCandidates: this.candidatesSignal().length,
        totalVotesCast: this.candidatesSignal().reduce((sum, c) => sum + c.votes, 0),
        activeElections: this.electionsSignal().filter(e => e.status === 'Active').length
    }));

    constructor() {
        this.loadInitialData();
        effect(() => localStorage.setItem('auditLogs', JSON.stringify(this.auditLogsSignal())));
    }

    private async loadInitialData() {
        try {
            console.log('Fetching data from API...');

            // Load Candidates
            const candidateData: any[] = await firstValueFrom(this.http.get<any[]>(`${this.apiUrl}/candidates`));
            console.log('Candidates fetched:', candidateData);
            this.candidatesSignal.set(candidateData);

            // Load Elections
            const electionData: any[] = await firstValueFrom(this.http.get<any[]>(`${this.apiUrl}/elections`));
            console.log('Elections fetched:', electionData);
            this.electionsSignal.set(electionData);

            // Load Voters
            const voterData: any[] = await firstValueFrom(this.http.get<any[]>(`${this.apiUrl}/voters`));
            console.log('Voters fetched:', voterData);
            this.votersSignal.set(voterData);

        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }

    // --- Election Actions ---
    async addElection(election: Omit<Election, 'id' | 'createdAt'>) {
        try {
            await firstValueFrom(this.http.post(`${this.apiUrl}/elections`, {
                name: election.name,
                description: election.description,
                startDate: election.startDate,
                endDate: election.endDate,
                status: election.status
            }));
            await this.loadInitialData();
            this.addAuditLog('Admin', 'CREATE', 'Election', `Created election: ${election.name}`);
        } catch (error) {
            console.error('Error adding election:', error);
        }
    }

    updateElectionStatus(id: string, status: Election['status']) {
        // Keeping status update local for now or can add a PUT endpoint if needed
        this.electionsSignal.update(list =>
            list.map(e => e.id === id ? { ...e, status } : e)
        );
        this.addAuditLog('Admin', 'UPDATE_STATUS', 'Election', `Updated election status to ${status}`);
    }

    // --- Candidate Actions ---
    async addCandidate(candidate: Omit<Candidate, 'id' | 'votes'>) {
        try {
            await firstValueFrom(this.http.post(`${this.apiUrl}/candidates`, {
                name: candidate.name,
                position: candidate.position,
                party: candidate.party,
                electionId: candidate.electionId
            }));

            // Reload candidates from server
            await this.loadInitialData();

            this.addAuditLog('Admin', 'CREATE', 'Candidate', `Added candidate: ${candidate.name}`);
        } catch (error) {
            console.error('Error adding candidate:', error);
        }
    }

    async deleteCandidate(id: string) {
        try {
            await firstValueFrom(this.http.delete(`${this.apiUrl}/candidates/${id}`));
            await this.loadInitialData();
            this.addAuditLog('Admin', 'DELETE', 'Candidate', `Deleted candidate with ID: ${id}`);
        } catch (error) {
            console.error('Error deleting candidate:', error);
        }
    }

    // --- Voter Actions ---
    async addVoter(voter: Omit<Voter, 'id' | 'hasVoted' | 'isActive'>) {
        try {
            await firstValueFrom(this.http.post(`${this.apiUrl}/voters`, {
                name: voter.name,
                email: voter.email,
                electionId: voter.electionId
            }));
            await this.loadInitialData();
            this.addAuditLog('Admin', 'CREATE', 'Voter', `Added voter: ${voter.name}`);
        } catch (error) {
            console.error('Error adding voter:', error);
        }
    }

    toggleVoterStatus(id: string) {
        this.votersSignal.update(list =>
            list.map(v => v.id === id ? { ...v, isActive: !v.isActive } : v)
        );
    }

    // --- Audit Log ---
    private addAuditLog(actorId: string, action: string, targetEntity: string, details: string) {
        const log: AuditLog = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            actorId,
            action,
            targetEntity,
            details
        };
        this.auditLogsSignal.update(list => [log, ...list]);
    }

    // --- Storage Helper ---
    private loadFromStorage<T>(key: string, defaultValue: T): T {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : defaultValue;
    }
}
