import { Component, Input, Output, EventEmitter, OnInit, signal, inject } from '@angular/core';
import { AuctionService } from '../../services/auction.service';
import { ARTISTS, DEFAULT_BIO, ArtistInfo } from '../../data/artists.data';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-artist-modal',
  template: `
    <!-- Backdrop -->
    <div class="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md">
      <!-- Wrapper de centragem: garante scroll quando o modal é mais alto que o ecrã -->
      <div class="flex min-h-full items-center justify-center p-4"
           (click)="onBackdropClick($event)">

      <!-- Modal -->
      <div class="relative w-full max-w-2xl bg-[#012845] border border-[#0c82cd]/30 rounded-3xl shadow-2xl overflow-hidden animate-fade-in"
           (click)="$event.stopPropagation()">

        <!-- Fechar -->
        <button (click)="close.emit()" aria-label="Fechar"
          class="absolute top-4 right-4 z-10 bg-[#001220]/80 text-sky-400 hover:text-white hover:bg-rose-500/20 p-2 rounded-full transition-all cursor-pointer">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        @if (loading()) {
          <div class="flex flex-col md:flex-row animate-pulse">
            <div class="md:w-2/5 shrink-0 h-56 md:h-auto md:min-h-[18rem] bg-[#001220]/70"></div>
            <div class="flex-1 p-6 md:p-8 space-y-3">
              <div class="h-3 w-24 bg-[#024675]/40 rounded"></div>
              <div class="h-6 w-48 bg-[#024675]/40 rounded"></div>
              <div class="h-3 w-full bg-[#024675]/40 rounded mt-4"></div>
              <div class="h-3 w-3/4 bg-[#024675]/40 rounded"></div>
            </div>
          </div>
        } @else {
          <div class="flex flex-col md:flex-row">

            <!-- Fotografia — em mobile aparece primeiro, em destaque -->
            <div class="md:w-2/5 shrink-0 bg-[#001220]">
              @if (artist().photo && !photoError()) {
                <img [src]="artist().photo" [alt]="'Fotografia de ' + artist().name"
                     (error)="photoError.set(true)"
                     class="w-full aspect-[4/3] md:aspect-auto md:h-full object-cover object-top" />
              } @else {
                <!-- Avatar com iniciais quando não há fotografia -->
                <div class="w-full aspect-[4/3] md:aspect-auto md:h-full md:min-h-[14rem] flex items-center justify-center">
                  <div class="w-24 h-24 rounded-full bg-sky-950 border border-sky-500/30 text-sky-400
                              font-black text-3xl flex items-center justify-center select-none">
                    {{ initials() }}
                  </div>
                </div>
              }
            </div>

            <!-- Texto -->
            <div class="flex-1 p-6 md:p-8">
              <p class="text-sky-400 text-[10px] font-bold uppercase tracking-widest mb-2">Sobre o Artista</p>
              <h2 class="text-2xl font-extrabold text-white mb-1">{{ artist().name }}</h2>

              <div class="mt-1 mb-4 flex items-center gap-3">
                <div class="h-[1px] w-8 bg-gradient-to-r from-sky-500/40 to-transparent"></div>
                <div class="h-1.5 w-1.5 rounded-full border border-sky-500/40 bg-sky-500/20"></div>
              </div>

              <p class="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{{ artist().bio }}</p>

              <div class="mt-6 flex items-start gap-2 bg-purple-950/20 border border-purple-500/20 rounded-2xl p-3">
                <svg class="w-4 h-4 text-purple-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                </svg>
                <p class="text-[11px] text-[#ebd8ff]/80 leading-relaxed">
                  As obras deste artista foram doadas ao Leilão Solidário do 5º aniversário da
                  <strong>Associação PDPT</strong>.
                </p>
              </div>
            </div>

          </div>
        }
      </div>
      </div>
    </div>
  `,
})
export class ArtistModalComponent implements OnInit {
  @Input({ required: true }) artistName!: string;
  @Output() close = new EventEmitter<void>();

  private auctionSvc = inject(AuctionService);

  loading = signal(true);
  photoError = signal(false);
  artist = signal<ArtistInfo>({ name: '', photo: '', bio: '' });

  ngOnInit() {
    // Fallback imediato: dados estáticos ou texto padrão
    this.artist.set(
      ARTISTS[this.artistName] ?? { name: this.artistName, photo: '', bio: DEFAULT_BIO },
    );

    // Dados geridos pelo admin (BD) têm prioridade
    this.auctionSvc.getArtist(this.artistName).subscribe({
      next: (a) => {
        const photo = a.photo ?? '';
        this.artist.set({
          name: a.name,
          // Caminhos locais (/api/uploads/...) precisam do apiBase em dev
          photo: photo.startsWith('/') ? environment.apiBase + photo : photo,
          bio: a.bio?.trim() || DEFAULT_BIO,
        });
        this.loading.set(false);
      },
      error: () => this.loading.set(false), // 404 → mantém o fallback
    });
  }

  initials(): string {
    return this.artist().name
      .split(/\s+/)
      .map(p => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  onBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) this.close.emit();
  }
}
