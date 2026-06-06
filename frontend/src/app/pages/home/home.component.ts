import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { AuctionService } from '../../services/auction.service';
import { CountdownComponent } from '../../components/countdown/countdown.component';
import { Artwork } from '../../models/auction.models';
import { resolveAsset } from '../../utils/assets';

@Component({
  selector: 'app-home',
  imports: [RouterLink, CurrencyPipe, CountdownComponent],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  private auctionSvc = inject(AuctionService);

  artworks = signal<Artwork[]>([]);
  loading = signal(true);
  error = signal('');

  asset = resolveAsset;

  ngOnInit() {
    this.auctionSvc.getArtworks().subscribe({
      next: (data) => { this.artworks.set(data); this.loading.set(false); },
      error: () => { this.error.set('Não foi possível carregar as obras. Verifique se o servidor está a correr.'); this.loading.set(false); },
    });
  }
}
