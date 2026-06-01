import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  template: `
    <nav class="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <a routerLink="/" class="flex items-center gap-2 group">
          <span class="text-2xl">🎨</span>
          <span class="text-xl font-bold tracking-tight text-white group-hover:text-violet-400 transition-colors">
            Leilão de Artes
          </span>
        </a>
        <div class="flex items-center gap-3 sm:gap-4">
          <span class="inline-flex items-center gap-1.5 text-sm text-emerald-400 font-medium">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="hidden sm:inline">Leilão ao vivo</span>
          </span>
        </div>
      </div>
    </nav>
  `,
})
export class NavbarComponent {}
