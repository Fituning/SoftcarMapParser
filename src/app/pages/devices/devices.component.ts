// src/app/pages/devices/devices.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeviceProfileService, DeviceProfile } from '../../shared/device-profile.service';

@Component({
  selector: 'app-devices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './devices.component.html'
})
export class DevicesComponent {
  dev = inject(DeviceProfileService);
  editing = signal<DeviceProfile | null>(null);

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
