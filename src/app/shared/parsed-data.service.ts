import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ParsedDataService {
  private _entries = new BehaviorSubject<MapEntry[] | null>(null);
  entries$ = this._entries.asObservable();

  setEntries(e: MapEntry[] | null) { this._entries.next(e); }
  get entries(): MapEntry[] | null { return this._entries.value; }

  get count(): number { return this._entries.value?.length ?? 0; }

  clear() { this._entries.next(null); }
}
