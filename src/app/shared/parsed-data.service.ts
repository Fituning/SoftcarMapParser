import {Injectable, signal} from '@angular/core';
import {MapEntry} from '../../shared/map-types';

@Injectable({ providedIn: 'root' })
export class ParsedDataService {
  // état interne
  private _entries = signal<MapEntry[]>([]);

  // lecture publique (signal en readonly)
  public readonly entries = this._entries.asReadonly();

  setEntries(e: MapEntry[]) {
    this._entries.set(Array.isArray(e) ? e : []);
  }

  clear() {
    this._entries.set([]);
  }
}
