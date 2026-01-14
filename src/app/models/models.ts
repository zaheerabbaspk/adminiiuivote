export type ElectionStatus = 'Draft' | 'Active' | 'Paused' | 'Ended';

export interface Election {
    id: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    status: ElectionStatus;
    createdAt: string;
    positions?: string[];
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

export interface Token {
    id: number;
    token: string;
    isUsed: boolean;
}

export interface TokenBatch {
    batchId: string;
    elections: { id: string; name: string }[];
    tokens: Token[];
}

export interface CandidateResult {
    id: number;
    name: string;
    position: string;
    party: string;
    election_id: string;
    image_url: string;
    vote_count: number;
    image: string;
}

export interface ElectionResult {
    electionId: number;
    electionName: string;
    status: string;
    totalVotes: number;
    candidates: CandidateResult[];
}
