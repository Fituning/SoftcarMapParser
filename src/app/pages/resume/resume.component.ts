import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileStateService } from '../../shared/file-state.service';

@Component({
  standalone: true,
  selector: 'app-resume',
  imports: [CommonModule],
  templateUrl: './resume.component.html',
})
export class ResumeComponent {
  file$ = inject(FileStateService).fileName$;
}
