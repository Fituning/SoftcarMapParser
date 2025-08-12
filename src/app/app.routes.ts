import { Routes } from '@angular/router';
import { ResumeComponent } from './pages/resume/resume.component';
import { DetailComponent } from './pages/detail/detail.component';
import { DevicesComponent } from './pages/devices/devices.component';


export const routes: Routes = [
  { path: 'resume', component: ResumeComponent },
  { path: 'detail', component: DetailComponent },
  { path: 'devices', component: DevicesComponent },
  { path: '**', redirectTo: 'resume' }
];
