import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <div class="relative min-h-screen bg-[#013457] bg-gradient-to-b from-[#013457] via-[#012845] to-[#001220] text-white overflow-hidden">
      <!-- Riscas diagonais decorativas -->
      <div class="absolute bottom-0 left-0 w-full sm:w-[45%] h-[500px] angular-stripes-left opacity-[0.22] pointer-events-none"></div>
      <div class="absolute bottom-0 right-0 w-full sm:w-[45%] h-[500px] angular-stripes-right opacity-[0.22] pointer-events-none"></div>

      <app-navbar />
      <main class="min-h-screen relative">
        <router-outlet />
      </main>
    </div>
  `,
})
export class App {}
