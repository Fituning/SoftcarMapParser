import {Component, inject, NgZone, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterOutlet, RouterLink, RouterLinkActive, Router} from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FileStateService } from './shared/file-state.service';
import { SidebarService } from './shared/sidebar.service';
import { DeviceProfileService } from './shared/device-profile.service';
import {MapEntry} from '../types/map-types';
import {ParsedDataService} from './shared/parsed-data.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {
  fileName$ = inject(FileStateService).fileName$;
  sidebar   = inject(SidebarService);
  dev       = inject(DeviceProfileService);
  router    = inject(Router);
  private fileState = inject(FileStateService);
  private parsedStore = inject(ParsedDataService);
  private zone = inject(NgZone);

  parseMsg = signal<string>('');
  parseOk  = signal<boolean | null>(null);

  saveCustom() {
    // On récupère les valeurs déjà mises dans le header
    const flash = this.dev.flashBytes();
    const ram = this.dev.ramBytes();

    // On redirige vers /devices avec les valeurs pré-remplies
    this.router.navigate(['/devices'], {
      queryParams: {
        mode: 'add',
        flash,
        ram
      }
    });
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
    this.zone.run(() => {
      this.parsedStore.setEntries(entries);
      const onlyName = filePath.split(/[\\/]/).pop() || filePath;
      this.fileState.setFileName(onlyName);
    });

    // this.router.navigate(['/resume']); // todo fix the unshowed value at first loading
  }
}
