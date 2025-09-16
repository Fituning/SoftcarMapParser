import {Component, inject, Input, OnChanges, SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  ApexChart,
  ApexDataLabels,
  ApexPlotOptions,
  ApexTooltip,
  ApexXAxis,
  ApexYAxis, ChartType,
  NgApexchartsModule
} from 'ng-apexcharts';
import {MapEntry, MemoryType} from '../../../../../types/map-types';
import {DeviceProfileService} from '../../../../shared/device-profile.service';

export type ChartOptions = {
  series : any;
  chart: ApexChart;
  dataLabels: ApexDataLabels | undefined;
  plotOptions: ApexPlotOptions;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  title: ApexTitleSubtitle;
  tooltip: ApexTooltip;
  fill: ApexFill;
  legend: ApexLegend;
};

type Row = { name: string; data: [number] };


@Component({
  standalone: true,
  selector: 'w-device-memory-fill',
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: "./device-memory-fill.apex.html"
})
export class DeviceMemoryFillApex implements OnChanges{
  @Input() entries: MapEntry[] = [];
  device = inject(DeviceProfileService)
  private filteredFlash: Row[] | undefined;
  private filteredRam: Row[] | undefined;
  test = [
    {
      name: "Marine Sprite",
      data: [44]
    },
    {
      name: "Striking Calf",
      data: [53]
    },
    {
      name: "Tank Picture",
      data: [12]
    },
    {
      name: "Bucket Slope",
      data: [9]
    },
    {
      name: "Reborn Kid",
      data: [25]
    }
  ]

  public chartOptions: ChartOptions;
  private sub: any;

  ngOnInit() {
    // 👇 on écoute les changements de device
    this.sub = this.device.selectedProfile$.subscribe(() => {
      this.updateChart();  // recalcul dès que la device change
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['entries']) {
      this.updateChart();  // recalcul dès que les entries changent
    }
  }

  private updateChart(){

    const flash = this.entries.filter(e => (e.memory_type ?? MemoryType.UNKNOWN) === MemoryType.FLASH);
    const ram = this.entries.filter(e => (e.memory_type ?? MemoryType.UNKNOWN) === MemoryType.RAM);

    this.filteredFlash = this.groupBySection(flash, MemoryType.FLASH)
    this.filteredRam = this.groupBySection(ram, MemoryType.RAM)

    this.chartOptions = this.createChart(this.filteredFlash, this.filteredRam)

  }

  groupBySection(entries : MapEntry[], memoryType : MemoryType){
    const mapSection = new Map<string, number>();
    for (const e of entries) {
      mapSection.set(e.section, (mapSection.get(e.section) ?? 0) + e.size);
    }
    // Filtrer les sections avec taille > 0
    const map = new Map(
      Array.from(mapSection).filter(([_, size]) => size > 0)
    );
    const arr: Row[] = Array.from(map, ([name, data]) => ({
      name,
      data: [ data]   // wrap le nombre dans un tableau
    }));
    for (let col of arr){
      if(memoryType == MemoryType.FLASH ) {
        col.data[0] = Math.round((col.data[0] * 100 / this.device.flashBytes()) * 10) / 10;
      } else if(memoryType == MemoryType.RAM) {
        col.data[0] = Math.round((col.data[0] * 100 / this.device.ramBytes()) * 10) / 10;
      }
    }
    return arr
  }

  createChart(entries: Row[], ram: Row[]) : ChartOptions  {
    return {
      series: entries,
      chart: {
        type: "bar",
        height: 400,
        stacked: true
      },
      plotOptions: {
        bar: {
          horizontal: true
        }
      },
      stroke: {
        width: 1,
        colors: ["#fff"]
      },
      title: {
        text: "Flash"
      },
      xaxis: {
        categories: ["Flash","RAM"],
        labels: {
          formatter: function(val) {
            return val + "%";
          }
        }
      },
      yaxis: {
        title: {
          text: undefined
        }
      },
      tooltip: {
        y: {
          formatter: function(val) {
            return val + "%";
          }
        }
      },
      fill: {
        opacity: 1
      },
      legend: {
        position: "top",
        horizontalAlign: "left",
        offsetX: 40
      },
      dataLabels : undefined
    };
  }

  constructor() {
    this.chartOptions = this.createChart(this.filteredFlash ? this.filteredFlash : [],this.filteredRam ? this.filteredRam : [])
  }
}
