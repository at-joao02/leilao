import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { AuctionService } from '../../services/auction.service';
import { BidPayload } from '../../models/auction.models';

@Component({
  selector: 'app-bid-modal',
  imports: [FormsModule, CurrencyPipe],
  template: `
    <!-- Backdrop -->
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4"
         (click)="onBackdropClick($event)">
      <div class="absolute inset-0 bg-black/80 backdrop-blur-md"></div>

      <!-- Modal -->
      <div class="relative w-full max-w-md bg-[#012845] border border-[#0c82cd]/30 rounded-3xl p-6 shadow-2xl"
           (click)="$event.stopPropagation()">

        <button (click)="close.emit()" aria-label="Fechar"
          class="absolute top-4 right-4 bg-[#001220]/80 text-sky-400 hover:text-white hover:bg-rose-500/20 p-2 rounded-full transition-all">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        <h2 class="text-xl font-bold text-white mb-1">Fazer Lance</h2>
        <p class="text-sm text-slate-400 mb-5">
          {{ artworkTitle }} — Lance mínimo:
          <span class="text-[#d99f2a] font-semibold">{{ minBid | currency:'AOA':'Kz ':'1.0-0' }}</span>
        </p>

        @if (success()) {
          <div class="bg-emerald-500/20 border border-emerald-500/40 rounded-lg p-4 text-center">
            <p class="text-emerald-400 font-semibold text-lg">Lance registado!</p>
          </div>
        } @else {

          @if (error()) {
            <div class="bg-red-500/20 border border-red-500/40 rounded-lg p-3 mb-4 text-sm text-red-300">
              {{ error() }}
            </div>
          }

          <form #bidForm="ngForm" (ngSubmit)="submit(bidForm.valid)" class="space-y-4">

            <!-- Anónimo toggle -->
            <label class="flex items-center gap-3 cursor-pointer select-none">
              <div class="relative">
                <input type="checkbox" class="sr-only peer"
                  [(ngModel)]="payload.is_anonymous" name="is_anonymous"
                  (ngModelChange)="onAnonymousChange($event)" />
                <div class="w-10 h-5 bg-[#001220] border border-sky-500/30 rounded-full peer-checked:bg-sky-500 transition-colors"></div>
                <div class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
              </div>
              <span class="text-sm text-slate-300">Lance anónimo</span>
            </label>

            <!-- Campos de identidade — ocultados quando anónimo -->
            @if (!payload.is_anonymous) {
              <!-- Nome -->
              <div>
                <label class="block text-sm text-slate-400 mb-1.5">Nome *</label>
                <input type="text" name="name" required
                  [(ngModel)]="payload.name" #nameInput="ngModel"
                  class="w-full bg-[#001220] border border-sky-500/20 rounded-lg px-3 py-2.5 text-white text-sm
                         focus:outline-none focus:border-sky-400/60 transition-colors placeholder:text-slate-500"
                  placeholder="O seu nome" />
                @if (nameInput.invalid && nameInput.touched) {
                  <p class="text-red-400 text-xs mt-1">Nome obrigatório.</p>
                }
              </div>

              <!-- Empresa (opcional) -->
              <div>
                <label class="block text-sm text-slate-400 mb-1.5">Empresa <span class="text-slate-500">(opcional)</span></label>
                <input type="text" name="company"
                  [(ngModel)]="payload.company"
                  class="w-full bg-[#001220] border border-sky-500/20 rounded-lg px-3 py-2.5 text-white text-sm
                         focus:outline-none focus:border-sky-400/60 transition-colors placeholder:text-slate-500"
                  placeholder="Nome da empresa" />
              </div>
            } @else {
              <div class="bg-[#001220]/70 border border-sky-500/10 rounded-lg px-4 py-3 text-sm text-slate-400">
                A sua identidade não será associada ao lance.
              </div>
            }

            <!-- Valor -->
            <div>
              <label class="block text-sm text-slate-400 mb-1.5">Valor do Lance (Kz) *</label>
              <input type="number" name="amount" required [min]="minBid"
                [(ngModel)]="payload.amount" #amountInput="ngModel"
                class="w-full bg-[#001220] border border-sky-500/20 rounded-lg px-3 py-2.5 text-white text-sm
                       focus:outline-none focus:border-sky-400/60 transition-colors"
                [placeholder]="minBid.toString()" />
              @if (amountInput.invalid && amountInput.touched) {
                <p class="text-red-400 text-xs mt-1">Valor mínimo: {{ minBid }} Kz.</p>
              }
            </div>

            <button type="submit" [disabled]="loading()"
              class="w-full bg-[#2d0f3c] hover:bg-[#3f1654] border border-purple-500/35 disabled:opacity-50 disabled:cursor-not-allowed
                     text-white font-semibold rounded-xl py-3 transition-colors mt-2">
              @if (loading()) {
                <span class="inline-flex items-center gap-2">
                  <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  A registar...
                </span>
              } @else {
                Confirmar Lance
              }
            </button>

          </form>
        }
      </div>
    </div>
  `,
})
export class BidModalComponent {
  @Input({ required: true }) artworkId!: number;
  @Input({ required: true }) artworkTitle!: string;
  @Input({ required: true }) minBid!: number;
  @Output() close = new EventEmitter<void>();
  @Output() bidPlaced = new EventEmitter<number>();

  private auctionSvc = inject(AuctionService);

  loading = signal(false);
  error   = signal('');
  success = signal(false);

  payload: BidPayload = {
    name: '',
    company: '',
    amount: 0,
    is_anonymous: false,
  };

  onAnonymousChange(isAnon: boolean) {
    if (isAnon) {
      this.payload.name    = 'Anónimo';
      this.payload.company = '';
    } else {
      this.payload.name = '';
    }
  }

  onBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) this.close.emit();
  }

  submit(valid: boolean | null) {
    this.error.set('');
    if (!valid) return;

    if (this.payload.amount < this.minBid) {
      this.error.set(`O lance deve ser de pelo menos ${this.minBid} Kz.`);
      return;
    }

    this.loading.set(true);
    this.auctionSvc.placeBid(this.artworkId, {
      ...this.payload,
      company: this.payload.company || undefined,
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.success.set(true);
        this.bidPlaced.emit(res.new_price);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.error ?? 'Erro ao registar o lance. Tente novamente.');
      },
    });
  }
}
