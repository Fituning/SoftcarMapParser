import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FileStateService {
  private _fileName = new BehaviorSubject<string | null>(null);
  fileName$ = this._fileName.asObservable();

  setFileName(name: string | null) {
    this._fileName.next(name);
  }
  get fileName(): string | null {
    return this._fileName.value;
  }
}
