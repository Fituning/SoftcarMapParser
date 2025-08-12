import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';                       // 👈
import { FileStateService } from './shared/file-state.service';
import { SidebarService } from './shared/sidebar.service';
import { DeviceProfileService } from './shared/device-profile.service'; // 👈

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive], // 👈 FormsModule
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {
  fileName$ = inject(FileStateService).fileName$;
  sidebar   = inject(SidebarService);
  dev       = inject(DeviceProfileService); // 👈 accessible dans le template

  saveCustom() {
    const name = prompt('Nom du device à enregistrer (ex: My MCU) :');
    if (name) this.dev.saveCustomAsProfile(name);
  }
}
