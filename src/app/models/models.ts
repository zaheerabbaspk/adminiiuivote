export type ElectionStatus = 'Draft' | 'Active' | 'Paused' | 'Ended';

export interface Election {
    id: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    status: ElectionStatus;
    createdAt: string;
}

export interface Candidate {
    id: string;
    name: string;
    position: string;
    party: string;
    electionId: string;
    votes: number;
    imageUrl?: string;
}

export interface Voter {
    id: string;
    name: string;
    email: string;
    hasVoted: boolean;
    isActive: boolean;
    electionId: string;
}

export interface AuditLog {
    id: string;
    timestamp: string;
    actorId: string;
    action: string;
    targetEntity: string;
    details: string;
}

export interface DashboardStats {
    totalVoters: number;
    totalCandidates: number;
    totalVotesCast: number;
    activeElections: number;
}
