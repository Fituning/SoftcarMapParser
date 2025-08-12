import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileStateService } from '../../shared/file-state.service';
import { ParsedDataService } from '../../shared/parsed-data.service';
import { SectionDonutApex } from './charts/section-donut.apex';
import { MemoryBarApex } from './charts/memory-bar.apex';
import {MemorySectionsBarsApex} from './charts/memory-sections-bars.apex';

@Component({
  standalone: true,
  selector: 'app-resume',
  imports: [CommonModule, SectionDonutApex, MemoryBarApex, MemorySectionsBarsApex],
  templateUrl: './resume.component.html',
})
export class ResumeComponent {
  file$ = inject(FileStateService).fileName$;
  entries = inject(ParsedDataService).entries ?? []; // snapshot simple
}
