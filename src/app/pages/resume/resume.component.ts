import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileStateService } from '../../shared/file-state.service';
import { ParsedDataService } from '../../shared/parsed-data.service';
import { MemoryBarApex } from './charts/memory-bar.apex';
import {MemorySectionsBarsApex} from './charts/memory-sections-bars.apex';
import {MemoryType} from '../../../shared/map-types';
import {DeviceMemoryFillApex} from './charts/device-memory-fill/device-memory-fill.apex';

@Component({
  standalone: true,
  selector: 'app-resume',
  imports: [CommonModule, MemoryBarApex, MemorySectionsBarsApex, DeviceMemoryFillApex],
  templateUrl: './resume.component.html',
})
export class ResumeComponent {
  file$   = inject(FileStateService).fileName$;

  // 👇 IMPORTANT : on garde le signal, pas de "?? []"
  parsed  = inject(ParsedDataService);
  entries = this.parsed.entries;               // Signal<MapEntry[]>

  protected readonly MemoryType: typeof MemoryType = MemoryType;
}
