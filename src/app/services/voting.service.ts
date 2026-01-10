import { Injectable, signal, computed, effect } from '@angular/core';
import { Election, Candidate, Voter, AuditLog, DashboardStats } from '../models/models';

@Injectable({
    providedIn: 'root'
})
export class VotingService {
    // Signals for state
    private electionsSignal = signal<Election[]>(this.loadFromStorage('elections', []));
    private candidatesSignal = signal<Candidate[]>(this.loadFromStorage('candidates', []));
    private votersSignal = signal<Voter[]>(this.loadFromStorage('voters', []));
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
        // Persist to localStorage whenever signals change
        effect(() => localStorage.setItem('elections', JSON.stringify(this.electionsSignal())));
        effect(() => localStorage.setItem('candidates', JSON.stringify(this.candidatesSignal())));
        effect(() => localStorage.setItem('voters', JSON.stringify(this.votersSignal())));
        effect(() => localStorage.setItem('auditLogs', JSON.stringify(this.auditLogsSignal())));
    }

    // --- Election Actions ---
    addElection(election: Omit<Election, 'id' | 'createdAt'>) {
        const newElection: Election = {
            ...election,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString()
        };
        this.electionsSignal.update(list => [...list, newElection]);
        this.addAuditLog('Admin', 'CREATE', 'Election', `Created election: ${newElection.name}`);
    }

    updateElectionStatus(id: string, status: Election['status']) {
        this.electionsSignal.update(list =>
            list.map(e => e.id === id ? { ...e, status } : e)
        );
        this.addAuditLog('Admin', 'UPDATE_STATUS', 'Election', `Updated election status to ${status}`);
    }

    // --- Candidate Actions ---
    addCandidate(candidate: Omit<Candidate, 'id' | 'votes'>) {
        const newCandidate: Candidate = {
            ...candidate,
            id: crypto.randomUUID(),
            votes: 0
        };
        this.candidatesSignal.update(list => [...list, newCandidate]);
        this.addAuditLog('Admin', 'CREATE', 'Candidate', `Added candidate: ${newCandidate.name}`);
    }

    deleteCandidate(id: string) {
        this.candidatesSignal.update(list => list.filter(c => c.id !== id));
        this.addAuditLog('Admin', 'DELETE', 'Candidate', `Deleted candidate with ID: ${id}`);
    }

    // --- Voter Actions ---
    addVoter(voter: Omit<Voter, 'id' | 'hasVoted' | 'isActive'>) {
        const newVoter: Voter = {
            ...voter,
            id: crypto.randomUUID(),
            hasVoted: false,
            isActive: true
        };
        this.votersSignal.update(list => [...list, newVoter]);
        this.addAuditLog('Admin', 'CREATE', 'Voter', `Added voter: ${newVoter.name}`);
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
