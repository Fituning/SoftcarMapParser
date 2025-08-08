import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileStateService } from '../../shared/file-state.service';

@Component({
  standalone: true,
  selector: 'app-detail',
  imports: [CommonModule],
  templateUrl: './detail.component.html',
})
export class DetailComponent {
  file$ = inject(FileStateService).fileName$;
}
