import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParsedDataService } from '../../shared/parsed-data.service';
import { FileStateService } from '../../shared/file-state.service';
import {FormsModule} from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-detail',
  imports: [CommonModule, FormsModule],
  templateUrl: './detail.component.html',
})
export class DetailComponent {
  // state global
  file$ = inject(FileStateService).fileName$;
  private parsed = inject(ParsedDataService);

  // pagination
  pageSize = signal(25);
  page = signal(1);

  // filters (signals)
  filterText = signal('');
  filterSection = signal<string | null>(null);
  filterType = signal<string | null>(null);

  // entries brutes
  entriesSig = signal<MapEntry[] | null>(this.parsed.entries);

  // computed pour pagination
  total = computed(() => this.entriesSig()?.length ?? 0);
  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  paged = computed(() => {
    const data = this.entriesSig() ?? [];
    const start = (this.page() - 1) * this.pageSize();
    return data.slice(start, start + this.pageSize());
  });

  // actions pager
  setPageSize(sz: number) { this.pageSize.set(sz); this.page.set(1); }
  goto(p: number) { if (p >= 1 && p <= this.totalPages()) this.page.set(p); }
  prev() { this.goto(this.page() - 1); }
  next() { this.goto(this.page() + 1); }

  // format helpers
  hex(n: number, pad = 8) { return '0x' + n.toString(16).toUpperCase().padStart(pad, '0'); }
  bytes(n: number) {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n/1024).toFixed(1)} KB`;
    return `${(n/1024/1024).toFixed(2)} MB`;
  }

  // trackBy pour perf
  trackRow = (_: number, e: MapEntry) => e.address ^ e.size; // clé simple
}
