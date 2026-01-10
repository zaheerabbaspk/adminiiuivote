import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { VotingService } from '../../services/voting.service';

@Component({
    selector: 'app-audit-logs',
    templateUrl: './audit-log.page.html',
    standalone: true,
    imports: [CommonModule, IonicModule, FormsModule]
})
export class AuditLogPage {
    private votingService = inject(VotingService);

    logs = this.votingService.auditLogs;

    filterAction = signal<string>('');

    filteredLogs = computed(() => {
        const action = this.filterAction();
        if (!action) return this.logs();
        return this.logs().filter(log => log.action.includes(action.toUpperCase()));
    });

    getActionBadgeClass(action: string) {
        if (action.includes('CREATE')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        if (action.includes('UPDATE')) return 'bg-blue-50 text-blue-600 border-blue-100';
        if (action.includes('DELETE')) return 'bg-rose-50 text-rose-600 border-rose-100';
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
}
