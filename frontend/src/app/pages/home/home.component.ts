import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { AuctionService } from '../../services/auction.service';
import { CountdownComponent } from '../../components/countdown/countdown.component';
import { Artwork } from '../../models/auction.models';

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

  searchQuery = signal('');
  selectedArtist = signal('All');

  artists = computed(() => ['All', ...new Set(this.artworks().map(a => a.artist))]);

  filtered = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const artist = this.selectedArtist();
    return this.artworks().filter(a => {
      const matchesSearch = !q
        || a.title.toLowerCase().includes(q)
        || a.description.toLowerCase().includes(q)
        || a.artist.toLowerCase().includes(q);
      const matchesArtist = artist === 'All' || a.artist === artist;
      return matchesSearch && matchesArtist;
    });
  });

  ngOnInit() {
    this.auctionSvc.getArtworks().subscribe({
      next: (data) => { this.artworks.set(data); this.loading.set(false); },
      error: () => { this.error.set('Não foi possível carregar as obras. Verifique se o servidor está a correr.'); this.loading.set(false); },
    });
  }
}
