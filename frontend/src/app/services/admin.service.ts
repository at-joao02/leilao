import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AdminArtwork, AdminBidsResponse, ArtworkPayload, Artwork,
  ArtistRecord, ArtistPayload,
} from '../models/auction.models';
import { environment } from '../../environments/environment';

const STORAGE_KEY = 'admin_pwd';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/api/admin`;

  // ── Auth ────────────────────────────────────────────────────────────────────

  login(password: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.base}/login`, { password });
  }

  savePassword(pwd: string) { localStorage.setItem(STORAGE_KEY, pwd); }
  clearPassword()           { localStorage.removeItem(STORAGE_KEY); }
  isLoggedIn(): boolean     { return !!localStorage.getItem(STORAGE_KEY); }

  private headers(): HttpHeaders {
    return new HttpHeaders({ 'x-admin-password': localStorage.getItem(STORAGE_KEY) ?? '' });
  }

  // ── CRUD ────────────────────────────────────────────────────────────────────

  getArtworks(): Observable<AdminArtwork[]> {
    return this.http.get<AdminArtwork[]>(`${this.base}/artworks`, { headers: this.headers() });
  }

  getBids(artworkId: number): Observable<AdminBidsResponse> {
    return this.http.get<AdminBidsResponse>(`${this.base}/artworks/${artworkId}/bids`, { headers: this.headers() });
  }

  clearBids(artworkId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/artworks/${artworkId}/bids`, { headers: this.headers() });
  }

  createArtwork(payload: ArtworkPayload): Observable<Artwork> {
    return this.http.post<Artwork>(`${this.base}/artworks`, payload, { headers: this.headers() });
  }

  updateArtwork(id: number, payload: Partial<ArtworkPayload>): Observable<Artwork> {
    return this.http.put<Artwork>(`${this.base}/artworks/${id}`, payload, { headers: this.headers() });
  }

  deleteArtwork(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/artworks/${id}`, { headers: this.headers() });
  }

  // ── Artistas ────────────────────────────────────────────────────────────────

  getArtists(): Observable<ArtistRecord[]> {
    return this.http.get<ArtistRecord[]>(`${this.base}/artists`, { headers: this.headers() });
  }

  createArtist(payload: ArtistPayload): Observable<ArtistRecord> {
    return this.http.post<ArtistRecord>(`${this.base}/artists`, payload, { headers: this.headers() });
  }

  updateArtist(id: number, payload: ArtistPayload): Observable<ArtistRecord> {
    return this.http.put<ArtistRecord>(`${this.base}/artists/${id}`, payload, { headers: this.headers() });
  }

  deleteArtist(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/artists/${id}`, { headers: this.headers() });
  }
}
