// src/app/pages/devices/devices.component.ts
import {Component, ElementRef, inject, signal, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeviceProfileService, DeviceProfile } from '../../shared/device-profile.service';
import {ActivatedRoute} from '@angular/router';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {faPenToSquare,faTrashCan} from '@fortawesome/free-regular-svg-icons'

@Component({
  selector: 'app-devices',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './devices.component.html'
})
export class DevicesComponent {
  dev = inject(DeviceProfileService);
  route = inject(ActivatedRoute);
  editing = signal<DeviceProfile | null>(null);

  faPenToSquare =faPenToSquare
  faTrashCan = faTrashCan

  @ViewChild('nameInput') nameInput!: ElementRef<HTMLInputElement>; // 👈 pour focus

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['mode'] === 'add') {
        // Pré-remplissage
        const flash = Number(params['flash']) || 0;
        const ram = Number(params['ram']) || 0;

        this.editing.set({
          id: '',
          flashBytes: flash,
          ramBytes: ram
        });

        // Focus après un petit délai (pour que le DOM soit prêt)
        setTimeout(() => {
          this.nameInput?.nativeElement.focus();
        }, 0);
      }
    });
  }

  startAdd() {
    this.editing.set({ id: '', flashBytes: 0, ramBytes: 0 });
  }

  edit(profile: DeviceProfile) {
    this.editing.set({ ...profile });
  }

  cancelEdit() {
    this.editing.set(null);
  }

  save(profile: DeviceProfile) {
    if (!profile.id.trim()) return;
    const exists = this.dev.profiles().some(p => p.id === profile.id);
    exists ? this.dev.updateProfile(profile) : this.dev.addProfile(profile);
    this.editing.set(null);
  }

  delete(id: string) {
    if (confirm(`Supprimer ${id} ?`)) {
      this.dev.removeProfile(id);
    }
  }

  exportJson() {
    const blob = new Blob([this.dev.exportToJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'devices.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  importJson(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      file.text().then(content => {
        this.dev.importFromJson(content);
      });
    }
  }
}
