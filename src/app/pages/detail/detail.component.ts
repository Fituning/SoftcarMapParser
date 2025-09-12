import {Component, computed, inject, Signal, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParsedDataService } from '../../shared/parsed-data.service';
import { FileStateService } from '../../shared/file-state.service';
import {FormsModule} from '@angular/forms';
import {MapEntry} from '../../../types/map-types';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {faSquareCaretDown, faSquareCaretUp, faSquare} from '@fortawesome/free-regular-svg-icons'
import {faArrowDown, faArrowUp} from '@fortawesome/free-solid-svg-icons'

function computePagination(entries: () => MapEntry[] | null, page: () => number, pageSize: () => number){
  return computed(() => {
    const data = entries() ?? [];
    const start = (page() - 1) * pageSize();
    return data.slice(start, start + pageSize());
  });
}

type MapEntryKey = 'section_full'| 'section'| 'address'| 'size'| 'file'| 'symbols'| 'memory_region'| 'memory_type'

type SortDirection = 'asc' | 'dsc' | null;


@Component({
  standalone: true,
  selector: 'app-detail',
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.css'],
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
  entriesSig = signal<MapEntry[] | null>(this.parsed.entries());

  // computed pour pagination
  total = computed(() => this.entriesSig()?.length ?? 0)
  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  paged  = computePagination(this.entriesSig,this.page, this.pageSize)

  sortStates: Map<MapEntryKey, SortDirection> = new Map([
    ['section_full', null],
    ['section', null],
    ['address', null],
    ['size', null],
    ['file', null],
    ['symbols', null],
    ['memory_region', null],
    ['memory_type', null],
  ]);



  sortBy(col: MapEntryKey){
    let sortedEntries

    if(this.sortStates.get(col) == 'asc'){
      this.sortStates.set(col, 'dsc')
    }else if(this.sortStates.get(col) == 'dsc'){
      this.sortStates.set(col, null)
    }else{
      this.resetSortStates()
      this.sortStates.set(col, 'asc')
    }

    switch (col) {
      case 'section_full':
        sortedEntries = [...this.parsed.entries()].sort((a, b) => {
          const res = a.section_full.localeCompare(b.section_full);
          return this.sortStates.get(col) === 'asc' ? res : -res;
        });
        break
      case 'address':
        sortedEntries = [...this.parsed.entries()].sort((a, b) => {
          const res = a.address - b.address;
          return this.sortStates.get(col) === 'asc' ? res : -res;
        });
        break
      case 'size':
        sortedEntries = [...this.parsed.entries()].sort((a, b) => {
          const res = a.size - b.size
          return this.sortStates.get(col) === 'asc' ? res : -res;
        });
        break
      case 'memory_type':
        sortedEntries = [...this.parsed.entries()].sort((a, b) => {
          const res = a.memory_type.localeCompare(b.memory_type);
          return this.sortStates.get(col) === 'asc' ? res : -res;
        });
        break
      case 'file':
        sortedEntries = [...this.parsed.entries()].sort((a, b) => {
          const res = a.file.localeCompare(b.file);
          return this.sortStates.get(col) === 'asc' ? res : -res;
        });
        break
      default:
        sortedEntries = [...this.parsed.entries()].sort((a, b) => {
          const res = a.section_full.localeCompare(b.section_full);
          return this.sortStates.get(col) === 'asc' ? res : -res;
        });
        break
    }

    this.entriesSig = signal<MapEntry[] | null>(sortedEntries);

    this.paged  = computePagination(this.entriesSig,this.page, this.pageSize)
  }

  resetSortStates() {
    for (const key of this.sortStates.keys()) {
      this.sortStates.set(key, null);
    }
  }

  getSortIcon(col: MapEntryKey) {
    const dir = this.sortStates.get(col);
    if (dir === 'asc'){
      return faSquareCaretDown;
    }else if(dir === 'dsc'){
      return faSquareCaretUp;
    }else{
      return faSquare;
    }
  }

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
