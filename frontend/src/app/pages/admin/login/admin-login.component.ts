import { Component, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-admin-login',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center px-4 bg-[#013457]">
      <div class="w-full max-w-sm">

        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/30 mb-4">
            <svg class="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-white">Painel de Admin</h1>
          <p class="text-zinc-500 text-sm mt-1">Leilão de Artes</p>
        </div>

        <!-- Card -->
        <div class="bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl">

          @if (error()) {
            <div class="bg-red-500/15 border border-red-500/30 rounded-lg px-4 py-3 text-red-300 text-sm mb-5">
              {{ error() }}
            </div>
          }

          <form (ngSubmit)="submit()" #f="ngForm" class="space-y-4">
            <div>
              <label class="block text-sm text-zinc-400 mb-1.5">Password</label>
              <input
                type="password" name="password" required autocomplete="current-password"
                [(ngModel)]="password"
                class="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm
                       focus:outline-none focus:border-violet-500 transition-colors"
                placeholder="••••••••" />
            </div>

            <button type="submit" [disabled]="loading() || !password"
              class="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-700 disabled:cursor-not-allowed
                     text-white font-semibold rounded-xl py-3 transition-colors">
              @if (loading()) {
                <span class="inline-flex items-center gap-2">
                  <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  A entrar...
                </span>
              } @else {
                Entrar
              }
            </button>
          </form>
        </div>

        <p class="text-center mt-5">
          <a routerLink="/" class="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
            ← Voltar ao leilão
          </a>
        </p>
      </div>
    </div>
  `,
})
export class AdminLoginComponent {
  private adminSvc = inject(AdminService);
  private router   = inject(Router);

  password = '';
  loading = signal(false);
  error   = signal('');

  submit() {
    this.error.set('');
    this.loading.set(true);
    this.adminSvc.login(this.password).subscribe({
      next: () => {
        this.adminSvc.savePassword(this.password);
        this.router.navigate(['/admin']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.error ?? 'Erro ao autenticar.');
      },
    });
  }
}
