import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { FileStateService } from './shared/file-state.service';
import { SidebarService } from './shared/sidebar.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {
  fileName$ = inject(FileStateService).fileName$;
  sidebar = inject(SidebarService); // 👈 on utilise le service

  // (tu peux virer les anciens signals/méthodes locales sidebarOpen/toggleSidebar/closeSidebar)
}
