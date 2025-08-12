import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { ResumeComponent } from './pages/resume/resume.component';
import { DetailComponent } from './pages/detail/detail.component';
import { DevicesComponent } from './pages/devices/devices.component';


export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'resume', component: ResumeComponent },
  { path: 'detail', component: DetailComponent },
  { path: 'devices', component: DevicesComponent },
  { path: '**', redirectTo: '' }
];
