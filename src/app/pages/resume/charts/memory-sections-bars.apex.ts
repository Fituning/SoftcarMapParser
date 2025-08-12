import {Component, Input, OnChanges, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexGrid,
  ApexPlotOptions,
  ApexTooltip,
  ApexXAxis,
  ApexYAxis,
  NgApexchartsModule
} from 'ng-apexcharts';
import {MapEntry, MemoryType} from '../../../../types/map-types';

type Row = { name: string; bytes: number; pct: number };

@Component({
  standalone: true,
  selector: 'w-memory-sections-bars',
  imports: [CommonModule, NgApexchartsModule],
  template: `
  <div class="card h-100">
    <div class="card-body">
      <div class="text-center fw-semibold mb-1">- {{ memoryType }} -</div>
      <div class="text-center text-muted small mb-3">
        Espace total utilisé : {{ bytes(total()) }}
      </div>
      <div class="col-12 col-lg-12">
        <apx-chart
          [series]="series"
          [chart]="chart"
          [xaxis]="xaxis"
          [yaxis]="yaxis"
          [plotOptions]="plot"
          [dataLabels]="dataLabels"
          [tooltip]="tooltip"
          [grid]="grid">
        </apx-chart>
      </div>
    </div>
  </div>
  `
})
export class MemorySectionsBarsApex implements OnChanges {
  @Input() entries: MapEntry[] = [];
  @Input() memoryType: MemoryType = MemoryType.UNKNOWN;
  @Input() topN = 20;                     // combien de lignes max (le reste groupé “others”)

  // données pré-calculées pour légende et graphique
  rows = signal<Row[]>([]);
  total = signal<number>(0);

  // Apex options
  series: ApexAxisChartSeries = [{ name: 'Bytes', data: [] }];
  chart:  ApexChart = { type: 'bar', height: 360, toolbar: { show: false }, animations: { enabled: true } };
  plot:   ApexPlotOptions = { bar: { horizontal: true, barHeight: '70%', distributed: true } };
  dataLabels: ApexDataLabels = {
    enabled: true,
    formatter: (val: number) => this.bytes(val),
    style: { fontSize: '11px' }
  };
  tooltip: ApexTooltip = { y: { formatter: (v: number) => `${this.bytes(v)}` } };
  xaxis:  ApexXAxis = { title: { text: 'Bytes' }, labels: { formatter: (v: string) => this.bytes(Number(v)) } };
  yaxis:  ApexYAxis = { labels: { style: { fontSize: '12px' } } };
  grid:   ApexGrid  = { strokeDashArray: 3 };

  ngOnChanges() {
    // 1) agrège par section (exactement comme ton screen: .debug_info, .text, etc.)
    const mapSection = new Map<string, number>();
    const filtered = this.entries.filter(e => (e.memory_type ?? MemoryType.UNKNOWN) === this.memoryType);
    for (const e of filtered) {
      mapSection.set(e.section, (mapSection.get(e.section) ?? 0) + e.size);
    }
    // Filtrer les sections avec taille > 0
    const map = new Map(
      Array.from(mapSection).filter(([_, size]) => size > 0)
    );
    // 2) tri décroissant + topN (+ “others”)
    const arr: Row[] = Array.from(map, ([name, bytes]) => ({ name, bytes, pct: 0 }));
    arr.sort((a,b) => b.bytes - a.bytes);
    const kept = arr.slice(0, this.topN);
    const othersBytes = arr.slice(this.topN).reduce((s,r)=>s+r.bytes, 0);
    if (othersBytes > 0) kept.push({ name: 'others', bytes: othersBytes, pct: 0 });

    const total = kept.reduce((s,r)=>s+r.bytes, 0);
    for (const r of kept) r.pct = total ? (r.bytes * 100) / total : 0;

    // 3) push dans signals
    this.rows.set(kept);
    this.total.set(total);

    // 4) configure Apex (catégories + data) — on garde l’ordre trié
    const categories = kept.map(r => r.name);
    const values     = kept.map(r => r.bytes);

    // hauteur dynamique selon le nombre de barres (optionnel)
    const h = Math.max(60 + kept.length * 25, 200);
    this.chart = { ...this.chart, height: h,};

    this.series = [{ name: 'Bytes', data: values }];
    this.xaxis = { ...this.xaxis, categories };
  }

  bytes(n: number) {
    if (n < 1024) return `${n} B`;
    if (n < 1048576) return `${(n/1024).toFixed(0)} KB`;
    return `${(n/1048576).toFixed(2)} MB`;
  }
}
