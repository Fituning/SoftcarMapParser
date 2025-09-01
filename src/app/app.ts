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
    const filePath = await window.electronAPI.openMapDialog();
    if (!filePath) {
      this.zone.run(() => {
        this.parseMsg.set('Action annulée.');
        this.parseOk.set(false);
      });
      return;
    }

    const res = await window.electronAPI.parseMapFile(filePath);

    this.zone.run(() => {
      if ((res as any)?.error) {
        this.parsedStore.clear();
        this.fileState.setFileName(null);
        this.parseOk.set(false);
        this.parseMsg.set(`❌ Erreur parsing: ${(res as any).error}`);
        return;
      }

      const entries = res as MapEntry[];

      // ⬇️ parsedStore.entries est un SIGNAL → on lit avec ()
      console.log('[parse] BEFORE =', this.parsedStore.entries().length);
      this.parsedStore.setEntries(entries);
      console.log('[parse] AFTER  =', this.parsedStore.entries().length);

      const onlyName = filePath.split(/[\\/]/).pop() || filePath;
      this.fileState.setFileName(onlyName);
      this.parseOk.set(true);
      this.parseMsg.set(`✅ Parsing OK — ${entries.length} entrées`);

      // Navigation optionnelle: si t’es déjà sur /resume, inutile
      if (this.router.url !== '/resume') {
        this.router.navigate(['/resume']);
      }
    });
  }
}
