import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Artwork, ArtworkDetail, BidPayload, BidResponse } from '../models/auction.models';

@Injectable({ providedIn: 'root' })
export class AuctionService {
  private http = inject(HttpClient);
  private base = 'http://localhost:3000/api';

  getArtworks(): Observable<Artwork[]> {
    return this.http.get<Artwork[]>(`${this.base}/artworks`);
  }

  getArtwork(id: number): Observable<ArtworkDetail> {
    return this.http.get<ArtworkDetail>(`${this.base}/artworks/${id}`);
  }

  placeBid(artworkId: number, payload: BidPayload): Observable<BidResponse> {
    return this.http.post<BidResponse>(`${this.base}/artworks/${artworkId}/bid`, payload);
  }
}
