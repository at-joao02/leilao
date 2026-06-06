import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  template: `
    <header class="sticky top-0 z-40 bg-[#013457]/80 backdrop-blur-md border-b border-[#0c82cd]/25 px-6 py-4">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <a routerLink="/" class="flex items-center gap-3">
          <span class="font-bold text-lg md:text-xl text-white tracking-wide">
            Associação PDPT
          </span>
        </a>

        <div class="flex items-center gap-2 bg-[#024675]/60 hover:bg-[#024675]/80 px-4 py-1.5 rounded-full border border-sky-400/20 transition-all duration-300">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          <span class="font-semibold text-xs text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
            <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/>
              <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/>
              <circle cx="12" cy="12" r="2"/>
              <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/>
              <path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1"/>
            </svg>
            <span class="hidden sm:inline">Leilão ao vivo</span>
          </span>
        </div>
      </div>
    </header>
  `,
})
export class NavbarComponent {}
