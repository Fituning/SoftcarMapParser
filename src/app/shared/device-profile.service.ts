import { Injectable, signal, computed } from '@angular/core';
import devicesJson from '../config/devices.default.json'; // ton JSON donné

export interface DeviceProfile {
  id: string;          // ex: "NXP S32K144"
  flashBytes: number;
  ramBytes: number;
}

type DeviceId = string | 'Custom';

@Injectable({ providedIn: 'root' })
export class DeviceProfileService {
  private _profiles = signal<DeviceProfile[]>(devicesJson as DeviceProfile[]);
  private _selectedId = signal<DeviceId>(this._profiles()[0]?.id ?? 'Custom');

  // valeurs pour le mode Custom (pas dans le JSON)
  private _customFlash = signal(0);
  private _customRam   = signal(0);

  profiles   = this._profiles.asReadonly();            // liste depuis le JSON (+ ce qu’on ajoutera plus tard)
  selectedId = this._selectedId.asReadonly();
  isCustom   = computed(() => this._selectedId() === 'Custom');

  selectedProfile = computed<DeviceProfile | null>(() =>
    this.isCustom() ? null : this._profiles().find(p => p.id === this._selectedId()) ?? null
  );

  // Valeurs visibles partout (si Custom → champs custom, sinon profil sélectionné)
  flashBytes = computed(() => this.isCustom() ? this._customFlash() : (this.selectedProfile()?.flashBytes ?? 0));
  ramBytes   = computed(() => this.isCustom() ? this._customRam()   : (this.selectedProfile()?.ramBytes   ?? 0));

  // Actions
  selectDevice(id: DeviceId) {
    this._selectedId.set(id);
    if (!this.isCustom()) {
      // quand on choisit un device réel, pré-remplir les champs Custom avec ses valeurs (utile pour tweak)
      const p = this.selectedProfile();
      if (p) { this._customFlash.set(p.flashBytes); this._customRam.set(p.ramBytes); }
    }
  }
  setCustomFlash(v: number) { this._customFlash.set(Math.max(0, v|0)); }
  setCustomRam(v: number)   { this._customRam.set(Math.max(0, v|0)); }

  // Sauver le “Custom” comme vrai profil (en mémoire pour l’instant)
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
}
