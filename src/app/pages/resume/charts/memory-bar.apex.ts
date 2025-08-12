import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule, ApexAxisChartSeries, ApexChart, ApexXAxis, ApexYAxis, ApexPlotOptions, ApexTooltip, ApexDataLabels } from 'ng-apexcharts';

@Component({
  standalone: true,
  selector: 'w-memory-bar',
  imports: [CommonModule, NgApexchartsModule],
  template: `
  <div class="card h-100"><div class="card-body">
    <h6 class="card-title mb-3">Taille par type mémoire</h6>
    <apx-chart [series]="series" [chart]="chart" [xaxis]="xaxis" [yaxis]="yaxis"
               [plotOptions]="plot" [dataLabels]="dataLabels" [tooltip]="tooltip"></apx-chart>
  </div></div>
  `
})
export class MemoryBarApex implements OnChanges {
  @Input() entries: MapEntry[] = [];
  series: ApexAxisChartSeries = [{ name: 'Bytes', data: [] }];
  xaxis: ApexXAxis = { categories: [] };
  yaxis: ApexYAxis = { labels: { formatter: v => this.bytes(v as number) } };
  chart: ApexChart = { type: 'bar', height: 320, toolbar: { show: false } };
  plot: ApexPlotOptions = { bar: { horizontal: false, columnWidth: '55%' } };
  dataLabels: ApexDataLabels = { enabled: false };
  tooltip: ApexTooltip = { y: { formatter: v => this.bytes(v) } };

  ngOnChanges() {
    const m = new Map<string, number>();
    for (const e of this.entries) {
      const t = e.memory_region?.memory_type ?? 'UNKNOWN';
      m.set(t, (m.get(t) ?? 0) + e.size);
    }
    this.xaxis = { categories: [...m.keys()] };
    this.series = [{ name: 'Bytes', data: [...m.values()] }];
  }
  private bytes(n: number){ return n<1024?`${n} B`:n<1048576?`${(n/1024).toFixed(1)} KB`:`${(n/1048576).toFixed(2)} MB`; }
}
