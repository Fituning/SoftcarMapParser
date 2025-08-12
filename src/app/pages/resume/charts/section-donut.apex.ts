import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule, ApexChart, ApexLegend, ApexResponsive, ApexNonAxisChartSeries, ApexTooltip, ApexDataLabels, ApexFill, ApexStroke } from 'ng-apexcharts';
import {MapEntry} from '../../../../types/map-types';

@Component({
  standalone: true,
  selector: 'w-section-donut',
  imports: [CommonModule, NgApexchartsModule],
  template: `
  <div class="card h-100"><div class="card-body">
    <h6 class="card-title mb-3">Tailles par section</h6>
    <apx-chart [series]="series" [labels]="labels" [chart]="chart"
               [legend]="legend" [responsive]="responsive"
               [dataLabels]="dataLabels" [fill]="fill" [stroke]="stroke"
               [tooltip]="tooltip"></apx-chart>
  </div></div>
  `
})


export class SectionDonutApex implements OnChanges {
  @Input() entries: MapEntry[] = [];
  series: ApexNonAxisChartSeries = [];
  labels: string[] = [];
  chart: ApexChart = { type: 'donut', height: 320 };
  legend: ApexLegend = { position: 'bottom' };
  responsive: ApexResponsive[] = [{ breakpoint: 768, options: { chart: { height: 280 } } }];
  dataLabels: ApexDataLabels = { enabled: true, formatter: ( v :number ) => v.toFixed(0) + '%' };
  fill: ApexFill = { type: 'gradient' };
  stroke: ApexStroke = { width: 1 };
  tooltip: ApexTooltip = { y: { formatter: v => this.bytes(v) } };

  ngOnChanges() {
    const m = new Map<string, number>();
    for (const e of this.entries) m.set(e.section, (m.get(e.section) ?? 0) + e.size);
    this.labels = [...m.keys()];
    this.series = [...m.values()];
  }
  private bytes(n: number){ return n<1024?`${n} B`:n<1048576?`${(n/1024).toFixed(1)} KB`:`${(n/1048576).toFixed(2)} MB`; }
}
