import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileStateService } from '../../shared/file-state.service';
import { ParsedDataService } from '../../shared/parsed-data.service';
import {App} from '../../app';
import {SidebarService} from '../../shared/sidebar.service';
import {Router} from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  private router = inject(Router);
  private fileState = inject(FileStateService);
  private parsedStore = inject(ParsedDataService);
  private sidebar = inject(SidebarService);

  parseMsg = signal<string>('');
  parseOk  = signal<boolean | null>(null);

  ngOnInit() {
    const entries = this.parsedStore.entries;
    if (entries && entries.length > 0) {
      this.parseOk.set(true);
      this.parseMsg.set(`✅ Parsing OK — ${entries.length} entrées`);
    }
  }

  async openAndParse() {
    // 1) Choix du fichier (via Electron)
    const filePath = await window.electronAPI.openMapDialog();
    if (!filePath) {
      this.parseMsg.set('Action annulée.');
      this.parseOk.set(false);
      return;
    }

    // 2) Parsing côté Node
    const res = await window.electronAPI.parseMapFile(filePath);
    if ((res as any)?.error) {
      this.parsedStore.clear();
      this.fileState.setFileName(null);
      this.parseOk.set(false);
      this.parseMsg.set(`❌ Erreur parsing: ${(res as any).error}`);
      return;
    }

    // 3) Stockage + feedback
    const entries = res as MapEntry[];
    this.parsedStore.setEntries(entries);
    const onlyName = filePath.split(/[\\/]/).pop() || filePath;
    this.fileState.setFileName(onlyName);
    this.parseOk.set(true);
    this.parseMsg.set(`✅ Parsing OK — ${entries.length} entrées`);

    this.sidebar.open();
    this.router.navigate(['/resume']);
  }

  clear() {
    this.parsedStore.clear();
    this.fileState.setFileName(null);
    this.parseMsg.set('Données réinitialisées.');
    this.parseOk.set(null);
  }
}
