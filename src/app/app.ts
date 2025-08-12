import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterOutlet, RouterLink, RouterLinkActive, Router} from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FileStateService } from './shared/file-state.service';
import { SidebarService } from './shared/sidebar.service';
import { DeviceProfileService } from './shared/device-profile.service';

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
}
