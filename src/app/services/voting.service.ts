
import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Election, ElectionStatus, Candidate, Voter, AuditLog, DashboardStats } from '../models/models';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class VotingService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;

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

    // State flags
    public initialized = signal(false);
    public error = signal<string | null>(null);

    // Computed signals
    readonly stats = computed<DashboardStats>(() => ({
        totalVoters: this.votersSignal().length,
        totalCandidates: this.candidatesSignal().length,
        totalVotesCast: this.candidatesSignal().reduce((sum, c) => sum + c.votes, 0),
        activeElections: this.electionsSignal().filter(e => e.status === 'Active').length
    }));

    constructor() {
        this.refreshData();
        effect(() => localStorage.setItem('auditLogs', JSON.stringify(this.auditLogsSignal())));
    }

    async refreshData() {
        this.error.set(null);
        await this.loadInitialData();
    }

    private async loadInitialData() {
        try {
            console.log('Fetching data from API...');

            // Run requests in parallel and handle failures independently
            const [candidatesResult, electionsResult, votersResult] = await Promise.allSettled([
                firstValueFrom(this.http.get<any[]>(`${this.apiUrl}/candidates`)),
                firstValueFrom(this.http.get<any[]>(`${this.apiUrl}/elections`)),
                firstValueFrom(this.http.get<any[]>(`${this.apiUrl}/voters`))
            ]);

            // Handle Candidates
            if (candidatesResult.status === 'fulfilled') {
                const data = candidatesResult.value as any[];
                this.candidatesSignal.set(data.map((c: any) => ({
                    id: String(c.id),
                    name: c.name,
                    position: c.position,
                    party: c.party || '',
                    electionId: String(c.electionId || ''),
                    votes: Number(c.votes || 0),
                    imageUrl: c.imageUrl || ''
                })));
            } else {
                console.error('Failed to load candidates:', candidatesResult.reason);
            }

            // Handle Elections
            if (electionsResult.status === 'fulfilled') {
                this.electionsSignal.set(electionsResult.value as any[]);
            } else {
                console.error('Failed to load elections:', electionsResult.reason);
            }

            // Handle Voters
            if (votersResult.status === 'fulfilled') {
                this.votersSignal.set(votersResult.value as any[]);
            } else {
                console.error('Failed to load voters:', votersResult.reason);
            }

            // Check for critical failures (if all failed, likely backend down)
            if (candidatesResult.status === 'rejected' && electionsResult.status === 'rejected') {
                this.error.set('Could not connect to server. Please ensure backend is running.');
            }

            this.initialized.set(true);

        } catch (error) {
            console.error('Error loading initial data:', error);
            this.error.set('Unexpected error loading data');
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

    async updateElectionStatus(id: string, status: Election['status']) {
        try {
            await firstValueFrom(this.http.put(`${this.apiUrl}/elections/${id}`, { status }));
            this.electionsSignal.update(list =>
                list.map(e => e.id === id ? { ...e, status } : e)
            );
            this.addAuditLog('Admin', 'UPDATE_STATUS', 'Election', `Updated election status to ${status}`);
        } catch (error) {
            console.error('Error updating election status:', error);
        }
    }

    // --- Candidate Actions ---
    async addCandidate(candidate: Omit<Candidate, 'id' | 'votes'>) {
        try {
            await firstValueFrom(this.http.post(`${this.apiUrl}/candidates`, candidate));
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
