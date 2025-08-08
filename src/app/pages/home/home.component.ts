import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileStateService } from '../../shared/file-state.service';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  private fileState = inject(FileStateService);
  fileSize = signal<string | null>(null);

  triggerFile(input: HTMLInputElement) { input.click(); }

  onFileSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) return;
    this.fileState.setFileName(file.name);
    this.fileSize.set(`${(file.size/1024).toFixed(1)} KB`);
    // NOTE: pas de parsing ici, juste l’UI.
  }

  clearFile() {
    this.fileState.setFileName(null);
    this.fileSize.set(null);
  }
}
