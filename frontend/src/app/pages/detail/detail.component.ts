import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { AuctionService } from '../../services/auction.service';
import { CountdownComponent } from '../../components/countdown/countdown.component';
import { BidModalComponent } from '../../components/bid-modal/bid-modal.component';
import { ArtistModalComponent } from '../../components/artist-modal/artist-modal.component';
import { ArtworkDetail, ArtworkArtist } from '../../models/auction.models';
import { resolveAsset } from '../../utils/assets';

const MIN_INCREMENT = 500;

@Component({
  selector: 'app-detail',
  imports: [RouterLink, CurrencyPipe, DatePipe, CountdownComponent, BidModalComponent, ArtistModalComponent],
  templateUrl: './detail.component.html',
})
export class DetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private auctionSvc = inject(AuctionService);

  artwork = signal<ArtworkDetail | null>(null);
  loading = signal(true);
  error = signal('');
  showModal = signal(false);
  artistModalName = signal<string | null>(null);

  asset = resolveAsset;

  /** Lista de artistas da obra (fallback para o campo de texto antigo) */
  artistList = computed<ArtworkArtist[]>(() => {
    const a = this.artwork();
    if (!a) return [];
    if (a.artists?.length) return a.artists;
    return a.artist ? [{ id: 0, name: a.artist }] : [];
  });

  minBid = computed(() => {
    const a = this.artwork();
    return a ? a.current_price + MIN_INCREMENT : 0;
  });

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.auctionSvc.getArtwork(id).subscribe({
      next: (data) => { this.artwork.set(data); this.loading.set(false); },
      error: () => { this.error.set('Obra não encontrada.'); this.loading.set(false); },
    });
  }

  onBidPlaced(newPrice: number) {
    this.artwork.update(a => a ? { ...a, current_price: newPrice, total_bids: a.total_bids + 1 } : a);
    // Re-fetch to get updated bid history
    setTimeout(() => {
      const id = Number(this.route.snapshot.paramMap.get('id'));
      this.auctionSvc.getArtwork(id).subscribe(data => this.artwork.set(data));
    }, 1500);
  }
}
