// src/app/shared/device-profile.service.ts
import { Injectable, signal, computed } from '@angular/core';
import devicesJson from '../config/devices.default.json';

export interface DeviceProfile {
  id: string;
  flashBytes: number;
  ramBytes: number;
}

type DeviceId = string | 'Custom';

@Injectable({ providedIn: 'root' })
export class DeviceProfileService {
  private _profiles = signal<DeviceProfile[]>(devicesJson as DeviceProfile[]);
  private _selectedId = signal<DeviceId>(this._profiles()[0]?.id ?? 'Custom');

  private _customFlash = signal(0);
  private _customRam   = signal(0);

  profiles   = this._profiles.asReadonly();
  selectedId = this._selectedId.asReadonly();
  isCustom   = computed(() => this._selectedId() === 'Custom');

  selectedProfile = computed<DeviceProfile | null>(() =>
    this.isCustom() ? null : this._profiles().find(p => p.id === this._selectedId()) ?? null
  );

  flashBytes = computed(() => this.isCustom() ? this._customFlash() : (this.selectedProfile()?.flashBytes ?? 0));
  ramBytes   = computed(() => this.isCustom() ? this._customRam()   : (this.selectedProfile()?.ramBytes   ?? 0));

  selectDevice(id: DeviceId) {
    this._selectedId.set(id);
    if (!this.isCustom()) {
      const p = this.selectedProfile();
      if (p) { this._customFlash.set(p.flashBytes); this._customRam.set(p.ramBytes); }
    }
  }
  setCustomFlash(v: number) { this._customFlash.set(Math.max(0, v|0)); }
  setCustomRam(v: number)   { this._customRam.set(Math.max(0, v|0)); }

  saveCustomAsProfile(name: string) {
    const id = name.trim();
    if (!id) return;
    const exists = this._profiles().some(p => p.id === id);
    const newP: DeviceProfile = { id, flashBytes: this._customFlash(), ramBytes: this._customRam() };
    this._profiles.set(exists
      ? this._profiles().map(p => p.id === id ? newP : p)
      : [...this._profiles(), newP]
    );
    this._selectedId.set(id);
  }

  addProfile(profile: DeviceProfile) {
    this._profiles.set([...this._profiles(), profile]);
  }

  updateProfile(profile: DeviceProfile) {
    this._profiles.set(this._profiles().map(p => p.id === profile.id ? profile : p));
  }

  removeProfile(id: string) {
    this._profiles.set(this._profiles().filter(p => p.id !== id));
  }

  exportToJson(): string {
    return JSON.stringify(this._profiles(), null, 2);
  }

  importFromJson(jsonString: string) {
    try {
      const parsed = JSON.parse(jsonString) as DeviceProfile[];
      if (Array.isArray(parsed)) {
        this._profiles.set(parsed);
      }
    } catch (err) {
      console.error('Erreur import JSON', err);
    }
  }
}
