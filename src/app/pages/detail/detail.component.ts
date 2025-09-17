import {Component, computed, inject, Signal, signal, WritableSignal} from '@angular/core';
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

  // filters (signals)
  filterText = signal('');
  filterSections = signal<Set<string>>(new Set());
  filterType = signal<string | null>(null);

  // entries brutes
  rawEntries = signal<MapEntry[]>(this.parsed.entries());
  entriesSig: Signal<MapEntry[]> = this.rawEntries;


  selectedSections = signal<string[]>([]);
  filteredEntries = computed(() => {
    const entries = this.entriesSig() ?? [];
    const selected = this.selectedSections();
    if (selected.length === 0) return entries;
    return entries.filter(e => selected.includes(e.section));
  });

  // computed pour pagination
  total = computed(() => this.filteredEntries()?.length ?? 0)
  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  paged  = this.computePagination(this.filteredEntries)

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

  sections = computed(() => {
    const entries = this.entriesSig() ?? [];
    const unique = new Set(entries.map(e => e.section));
    return Array.from(unique).sort();
  });



  dropdownSettings = {
    singleSelection: false,
    text: "Sélectionner sections",
    selectAllText: "Tout sélectionner",
    unSelectAllText: "Tout désélectionner",
    enableSearchFilter: true,
    itemsShowLimit: 2 // 👈 n’affiche que 2 valeurs sélectionnées
  };

  computeEntries(){
    let computedEntries : Signal<MapEntry[]> = this.rawEntries
    //   Partie qui filtre les datas

    //   La partie qui trie les datas

    console.log(computedEntries())
    computedEntries = this.sortEntries(computedEntries)
    console.log(computedEntries())

    this.paged  = this.computePagination(computedEntries)
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

    console.log(col)

    this.computeEntries();
  }

  resetSortStates() {
    for (const key of this.sortStates.keys()) {
      this.sortStates.set(key, null);
    }
  }

  sortEntries( entries : Signal<MapEntry[]>) : Signal<MapEntry[]>{
    let sortedEntries
    const state = this.getSortState()

    console.log(state)

    if (!state) return entries

    switch (state?.col) {
      case 'section_full':
        sortedEntries = [...entries()].sort((a, b) => {
          const res = a.section_full.localeCompare(b.section_full);
          console.log("in")
          return state?.dir === 'asc' ? res : -res;
        });
        break
      case 'address':
        sortedEntries = [...entries()].sort((a, b) => {
          const res = a.address - b.address;
          return state?.dir === 'asc' ? res : -res;
        });
        break
      case 'size':
        sortedEntries = [...entries()].sort((a, b) => {
          const res = a.size - b.size
          return state?.dir === 'asc' ? res : -res;
        });
        break
      case 'memory_type':
        sortedEntries = [...entries()].sort((a, b) => {
          const res = a.memory_type.localeCompare(b.memory_type);
          return state?.dir === 'asc' ? res : -res;
        });
        break
      case 'file':
        sortedEntries = [...entries()].sort((a, b) => {
          const res = a.file.localeCompare(b.file);
          return state?.dir === 'asc' ? res : -res;
        });
        break
      default:
        sortedEntries = [...entries()].sort((a, b) => {
          const res = a.section_full.localeCompare(b.section_full);
          return state?.dir === 'asc' ? res : -res;
        });
        break
    }

    return signal<MapEntry[]>(sortedEntries)
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

  selectedEntry: MapEntry = this.paged()[0];

  openModal(entry: MapEntry) {
    this.selectedEntry = entry;
  }

  computePagination(entries: () => MapEntry[] | null){
    return computed(() => {
      const data = entries() ?? [];
      const start = (this.page() - 1) * this.pageSize();
      return data.slice(start, start + this.pageSize());
    });
  }

  // trackBy pour perf
  trackRow = (_: number, e: MapEntry) => e.address ^ e.size; // clé simple
}
