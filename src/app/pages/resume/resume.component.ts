import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileStateService } from '../../shared/file-state.service';
import { ParsedDataService } from '../../shared/parsed-data.service';

@Component({
  standalone: true,
  selector: 'app-resume',
  imports: [CommonModule],
  templateUrl: './resume.component.html',
})
export class ResumeComponent {
  private parsed = inject(ParsedDataService); // ✅ on l’injecte

  file$ = inject(FileStateService).fileName$;
  count$ = this.parsed.entries$; // ou juste this.parsed.count en getter
}
