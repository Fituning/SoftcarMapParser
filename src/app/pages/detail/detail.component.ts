import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParsedDataService } from '../../shared/parsed-data.service';
import { FileStateService } from '../../shared/file-state.service';
import { FormsModule } from '@angular/forms';
import { MapEntry } from '../../../shared/map-types';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSquareCaretDown, faSquareCaretUp, faSquare } from '@fortawesome/free-regular-svg-icons';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';

type MapEntryKey =
  | 'section_full'
  | 'section'
  | 'address'
  | 'size'
  | 'file'
  | 'symbols'
  | 'memory_region'
  | 'memory_type';

type SortDirection = 'asc' | 'dsc' | null;

@Component({
  standalone: true,
  selector: 'app-detail',
  imports: [CommonModule, FormsModule, FontAwesomeModule, NgMultiSelectDropDownModule],
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.css'],
})
export class DetailComponent {
  // Global state
  file$ = inject(FileStateService).fileName$;
  private parsed = inject(ParsedDataService);

  // Pagination state
  pageSize = signal(25);
  page = signal(1);

  // Raw entries coming from the parser
  rawEntries = signal<MapEntry[]>(this.parsed.entries());

  // Pagination values (not reactive yet)
  total = this.rawEntries()?.length ?? 0;
  totalPages = Math.max(1, Math.ceil(this.total / this.pageSize()));
  paged = this.rawEntries().slice(
    (this.page() - 1) * this.pageSize(),
    (this.page() - 1) * this.pageSize() + this.pageSize()
  );

  // Sorting state for each column
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

  // Filters (signals)
  sections = computed(() => {
    const entries = this.rawEntries() ?? [];
    const unique = new Set(entries.map(e => e.section));
    return Array.from(unique).sort();
  });
  selectedSections = signal<string[]>([]);

  memoryType = computed(() => {
    const entries = this.rawEntries() ?? [];
    const unique = new Set(entries.map(e => e.memory_type));
    return Array.from(unique).sort();
  });
  selectedMemoryTypes = signal<string[]>([]);

  constructor() {
    // Re-run computeEntries whenever a filter changes
    effect(() => {
      this.selectedSections();
      this.selectedMemoryTypes();
      this.computeEntries();
    });
  }

  // Settings for the multi-select dropdown
  dropdownSettings = {
    singleSelection: false,
    text: 'Select sections',
    selectAllText: 'Select all',
    unSelectAllText: 'Unselect all',
    enableSearchFilter: true,
    itemsShowLimit: 2, // only display 2 selected values before collapsing
  };

  // Apply filters, sorting and update pagination
  computeEntries() {
    let computedEntries: MapEntry[] = this.rawEntries();

    //   Partie qui filtre les datas
    if (this.selectedSections().length !== 0) computedEntries = computedEntries.filter(e => this.selectedSections().includes(e.section))
    if (this.selectedMemoryTypes().length !== 0) computedEntries = computedEntries.filter(e => this.selectedMemoryTypes().includes(e.memory_type))

    // Apply memory type filter
    if (this.selectedMemoryTypes().length !== 0) {
      computedEntries = computedEntries.filter(e =>
        this.selectedMemoryTypes().includes(e.memory_type)
      );
    }

    // Apply sorting
    computedEntries = this.sortEntries(computedEntries);

    // Update pagination and refresh view
    this.computePagination(computedEntries);
  }

  // Return the active sort state (column + direction) if any
  getSortState(): { col: MapEntryKey; dir: 'asc' | 'dsc' } | null {
    for (const [col, dir] of this.sortStates) {
      if (dir === 'asc' || dir === 'dsc') {
        return { col, dir };
      }
    }
    return null;
  }

  // Handle click on a column header to toggle sort state
  sortTrigger(col: MapEntryKey) {
    if (this.sortStates.get(col) === 'asc') {
      this.sortStates.set(col, 'dsc');
    } else if (this.sortStates.get(col) === 'dsc') {
      this.sortStates.set(col, null);
    } else {
      this.resetSortStates();
      this.sortStates.set(col, 'asc');
    }

    this.computeEntries();
  }

  // Reset all sort states to null
  resetSortStates() {
    for (const key of this.sortStates.keys()) {
      this.sortStates.set(key, null);
    }
  }

  // Sort entries according to the current sort state
  sortEntries(entries: MapEntry[]): MapEntry[] {
    const state = this.getSortState();
    if (!state) return entries;

    switch (state.col) {
      case 'section_full':
        return [...entries].sort((a, b) =>
          state.dir === 'asc'
            ? a.section_full.localeCompare(b.section_full)
            : b.section_full.localeCompare(a.section_full)
        );
      case 'address':
        return [...entries].sort((a, b) =>
          state.dir === 'asc' ? a.address - b.address : b.address - a.address
        );
      case 'size':
        return [...entries].sort((a, b) =>
          state.dir === 'asc' ? a.size - b.size : b.size - a.size
        );
      case 'memory_type':
        return [...entries].sort((a, b) =>
          state.dir === 'asc'
            ? a.memory_type.localeCompare(b.memory_type)
            : b.memory_type.localeCompare(a.memory_type)
        );
      case 'file':
        return [...entries].sort((a, b) =>
          state.dir === 'asc'
            ? a.file.localeCompare(b.file)
            : b.file.localeCompare(a.file)
        );
      default:
        return [...entries].sort((a, b) =>
          state.dir === 'asc'
            ? a.section_full.localeCompare(b.section_full)
            : b.section_full.localeCompare(a.section_full)
        );
    }
  }

  // Return the correct sort icon for the given column
  getSortIcon(col: MapEntryKey) {
    const dir = this.sortStates.get(col);
    if (dir === 'asc') {
      return faSquareCaretDown;
    } else if (dir === 'dsc') {
      return faSquareCaretUp;
    } else {
      return faSquare;
    }
  }

  // Pagination actions
  setPageSize(sz: number) {
    this.pageSize.set(sz);
    this.page.set(1);
  }
  goto(p: number) {
    if (p >= 1 && p <= this.totalPages) this.page.set(p);
  }
  prev() {
    this.goto(this.page() - 1);
  }
  next() {
    this.goto(this.page() + 1);
  }

  // Format helpers
  hex(n: number, pad = 8) {
    return '0x' + n.toString(16).toUpperCase().padStart(pad, '0');
  }
  bytes(n: number) {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(2)} MB`;
  }

  // Selected entry for the modal
  selectedModalEntry: MapEntry = this.paged[0];
  openModal(entry: MapEntry) {
    this.selectedModalEntry = entry;
  }

  // Compute pagination based on the filtered + sorted entries
  computePagination(entries: MapEntry[] | null) {
    this.total = entries?.length ?? 0;
    this.totalPages = Math.max(1, Math.ceil(this.total / this.pageSize()));
    const data = entries ?? [];
    const start = (this.page() - 1) * this.pageSize();
    this.paged = data.slice(start, start + this.pageSize());
  }

  // Angular trackBy function to optimize rendering
  trackRow = (_: number, e: MapEntry) => e.address ^ e.size;
}
