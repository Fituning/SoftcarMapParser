import {Component, computed, effect, inject, Signal, signal, WritableSignal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParsedDataService } from '../../shared/parsed-data.service';
import { FileStateService } from '../../shared/file-state.service';
import {FormsModule} from '@angular/forms';
import {MapEntry} from '../../../types/map-types';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {faSquareCaretDown, faSquareCaretUp, faSquare} from '@fortawesome/free-regular-svg-icons'
import {NgMultiSelectDropDownModule} from 'ng-multiselect-dropdown';


type MapEntryKey = 'section_full'| 'section'| 'address'| 'size'| 'file'| 'symbols'| 'memory_region'| 'memory_type'
type SortDirection = 'asc' | 'dsc' | null;


@Component({
  standalone: true,
  selector: 'app-detail',
  imports: [CommonModule, FormsModule, FontAwesomeModule, NgMultiSelectDropDownModule],
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

  // entries brutes
  rawEntries = signal<MapEntry[]>(this.parsed.entries());

  // computed pour pagination
  total = this.rawEntries()?.length ?? 0
  totalPages = Math.max(1, Math.ceil(this.total / this.pageSize()))
  paged = this.rawEntries().slice((this.page() - 1) * this.pageSize(), (this.page() - 1) * this.pageSize() + this.pageSize())

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


  // filters (signals)
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
    effect(() => {
      const sections = this.selectedSections();
      const memoryType = this.selectedMemoryTypes();
      // chaque fois qu'un signal au dessus change, ce bloc est relancé
      this.computeEntries();
    });
  }



  dropdownSettings = {
    singleSelection: false,
    text: "Sélectionner sections",
    selectAllText: "Tout sélectionner",
    unSelectAllText: "Tout désélectionner",
    enableSearchFilter: true,
    itemsShowLimit: 2 // 👈 n’affiche que 2 valeurs sélectionnées
  };

  computeEntries(){
    let computedEntries : MapEntry[] = this.rawEntries()

    //   Partie qui filtre les datas
    if (this.selectedSections().length !== 0) computedEntries = computedEntries.filter(e => this.selectedSections().includes(e.section))
    if (this.selectedMemoryTypes().length !== 0) computedEntries = computedEntries.filter(e => this.selectedMemoryTypes().includes(e.memory_type))


    //   La partie qui trie les datas
    computedEntries = this.sortEntries(computedEntries)

    // update this.paged so the view gets refreshed
    this.computePagination(computedEntries)
  }

  getSortState(): { col: MapEntryKey; dir: "asc" | "dsc"; } | null {
    for (const [col, dir] of this.sortStates) {
      if (dir === "asc" || dir === 'dsc') {
        return { col, dir };
      }
    }
    return null;
  }

  sortTrigger(col: MapEntryKey){
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

  resetSortStates() {
    for (const key of this.sortStates.keys()) {
      this.sortStates.set(key, null);
    }
  }

  sortEntries( entries : MapEntry[]) : MapEntry[]{
    let sortedEntries
    const state = this.getSortState()

    if (!state) return entries

    switch (state?.col) {
      case 'section_full':
        sortedEntries = [...entries].sort((a, b) => {
          const res = a.section_full.localeCompare(b.section_full);
          return state?.dir === 'asc' ? res : -res;
        });
        break
      case 'address':
        sortedEntries = [...entries].sort((a, b) => {
          const res = a.address - b.address;
          return state?.dir === 'asc' ? res : -res;
        });
        break
      case 'size':
        sortedEntries = [...entries].sort((a, b) => {
          const res = a.size - b.size
          return state?.dir === 'asc' ? res : -res;
        });
        break
      case 'memory_type':
        sortedEntries = [...entries].sort((a, b) => {
          const res = a.memory_type.localeCompare(b.memory_type);
          return state?.dir === 'asc' ? res : -res;
        });
        break
      case 'file':
        sortedEntries = [...entries].sort((a, b) => {
          const res = a.file.localeCompare(b.file);
          return state?.dir === 'asc' ? res : -res;
        });
        break
      default:
        sortedEntries = [...entries].sort((a, b) => {
          const res = a.section_full.localeCompare(b.section_full);
          return state?.dir === 'asc' ? res : -res;
        });
        break
    }

    return sortedEntries
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
  goto(p: number) { if (p >= 1 && p <= this.totalPages) this.page.set(p); }
  prev() { this.goto(this.page() - 1); }
  next() { this.goto(this.page() + 1); }

  // format helpers
  hex(n: number, pad = 8) { return '0x' + n.toString(16).toUpperCase().padStart(pad, '0'); }
  bytes(n: number) {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n/1024).toFixed(1)} KB`;
    return `${(n/1024/1024).toFixed(2)} MB`;
  }

  selectedModalEntry: MapEntry = this.paged[0];

  openModal(entry: MapEntry) {
    this.selectedModalEntry = entry;
  }

  computePagination(entries: MapEntry[] | null){
    this.total = entries?.length ?? 0
    this.totalPages = Math.max(1, Math.ceil(this.total / this.pageSize()))
    const data = entries ?? [];
    const start = (this.page() - 1) * this.pageSize();
    this.paged = data.slice(start, start + this.pageSize())
  }

  // trackBy pour perf
  trackRow = (_: number, e: MapEntry) => e.address ^ e.size; // clé simple
}
