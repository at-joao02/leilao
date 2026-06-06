import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { resolveAsset } from '../../../utils/assets';
import { AdminArtwork, AdminBid, ArtworkPayload, ArtistRecord, ArtistPayload } from '../../../models/auction.models';

type ModalMode = 'create' | 'edit';

const EMPTY_FORM = (): ArtworkPayload => ({
  title: '', artist_ids: [], description: '', image: '', image_data: '',
  dimensions: '', starting_price: 0, auction_end: '',
});

const EMPTY_ARTIST_FORM = (): ArtistPayload => ({ name: '', photo: '', bio: '' });

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent implements OnInit {
  private adminSvc = inject(AdminService);
  private router   = inject(Router);

  artworks    = signal<AdminArtwork[]>([]);
  loading     = signal(true);
  loadError   = signal('');

  // Artwork form modal
  showForm    = signal(false);
  formMode    = signal<ModalMode>('create');
  formData    = signal<ArtworkPayload>(EMPTY_FORM());
  editingId   = signal<number | null>(null);
  formLoading = signal(false);
  formError   = signal('');

  // Bids modal
  showBids    = signal(false);
  bidsTitle   = signal('');
  bids        = signal<AdminBid[]>([]);
  bidsLoading = signal(false);

  // Delete confirm modal
  showDelete     = signal(false);
  deletingArtwork = signal<AdminArtwork | null>(null);
  deleteLoading  = signal(false);

  // Artists
  artists           = signal<ArtistRecord[]>([]);
  artistsLoading    = signal(true);
  showArtistForm    = signal(false);
  artistFormMode    = signal<ModalMode>('create');
  artistFormData    = signal<ArtistPayload>(EMPTY_ARTIST_FORM());
  editingArtistId   = signal<number | null>(null);
  artistFormLoading = signal(false);
  artistFormError   = signal('');
  showArtistDelete    = signal(false);
  deletingArtist      = signal<ArtistRecord | null>(null);
  artistDeleteLoading = signal(false);

  // Stats
  stats = computed(() => {
    const list = this.artworks();
    return {
      total:    list.length,
      active:   list.filter(a => a.is_active).length,
      totalBids: list.reduce((s, a) => s + a.total_bids, 0),
      topValue: Math.max(0, ...list.map(a => a.current_price)),
    };
  });

  ngOnInit() { this.load(); this.loadArtists(); }

  load() {
    this.loading.set(true);
    this.adminSvc.getArtworks().subscribe({
      next: (data) => { this.artworks.set(data); this.loading.set(false); },
      error: (err) => {
        if (err.status === 401) { this.adminSvc.clearPassword(); this.router.navigate(['/admin/login']); return; }
        this.loadError.set('Erro ao carregar obras.'); this.loading.set(false);
      },
    });
  }

  logout() { this.adminSvc.clearPassword(); this.router.navigate(['/admin/login']); }

  // ── Form modal ──────────────────────────────────────────────────────────────

  openCreate() {
    this.formMode.set('create');
    this.formData.set(EMPTY_FORM());
    this.editingId.set(null);
    this.formError.set('');
    this.showForm.set(true);
  }

  openEdit(a: AdminArtwork) {
    this.formMode.set('edit');
    this.editingId.set(a.id);
    this.formError.set('');
    // Convert "YYYY-MM-DD HH:MM:SS" → "YYYY-MM-DDTHH:MM" for datetime-local input
    const dt = a.auction_end.replace(' ', 'T').substring(0, 16);
    this.formData.set({
      title: a.title, artist_ids: a.artist_ids ?? [], description: a.description ?? '',
      image: a.image ?? '', image_data: '', dimensions: a.dimensions ?? '',
      starting_price: a.starting_price,
      current_price: a.current_price, auction_end: dt,
    });
    this.showForm.set(true);
  }

  submitForm() {
    this.formError.set('');
    const d = this.formData();
    if (!d.title.trim() || !d.starting_price || !d.auction_end) {
      this.formError.set('Preencha todos os campos obrigatórios.');
      return;
    }
    if (d.artist_ids.length === 0) {
      this.formError.set('Seleccione pelo menos um artista.');
      return;
    }
    // Convert datetime-local "YYYY-MM-DDTHH:MM" → "YYYY-MM-DD HH:MM:00"
    const payload = { ...d, auction_end: d.auction_end.replace('T', ' ') + ':00' };

    this.formLoading.set(true);
    const req = this.formMode() === 'create'
      ? this.adminSvc.createArtwork(payload)
      : this.adminSvc.updateArtwork(this.editingId()!, payload);

    req.subscribe({
      next: () => { this.formLoading.set(false); this.showForm.set(false); this.load(); },
      error: (err) => { this.formLoading.set(false); this.formError.set(err?.error?.error ?? 'Erro ao guardar.'); },
    });
  }

  // ── Bids modal ──────────────────────────────────────────────────────────────

  openBids(a: AdminArtwork) {
    this.bidsTitle.set(a.title);
    this.bids.set([]);
    this.bidsLoading.set(true);
    this.showBids.set(true);
    this.adminSvc.getBids(a.id).subscribe({
      next: (res) => { this.bids.set(res.bids); this.bidsLoading.set(false); },
      error: ()  => { this.bidsLoading.set(false); },
    });
  }

  // ── Delete modal ─────────────────────────────────────────────────────────────

  openDelete(a: AdminArtwork) { this.deletingArtwork.set(a); this.showDelete.set(true); }

  confirmDelete() {
    const a = this.deletingArtwork();
    if (!a) return;
    this.deleteLoading.set(true);
    this.adminSvc.deleteArtwork(a.id).subscribe({
      next: () => { this.deleteLoading.set(false); this.showDelete.set(false); this.load(); },
      error: () => { this.deleteLoading.set(false); },
    });
  }

  // ── Artistas ─────────────────────────────────────────────────────────────────

  loadArtists() {
    this.artistsLoading.set(true);
    this.adminSvc.getArtists().subscribe({
      next: (data) => { this.artists.set(data); this.artistsLoading.set(false); },
      error: () => this.artistsLoading.set(false),
    });
  }

  openCreateArtist() {
    this.artistFormMode.set('create');
    this.artistFormData.set(EMPTY_ARTIST_FORM());
    this.editingArtistId.set(null);
    this.artistFormError.set('');
    this.showArtistForm.set(true);
  }

  openEditArtist(a: ArtistRecord) {
    this.artistFormMode.set('edit');
    this.editingArtistId.set(a.id);
    this.artistFormError.set('');
    this.artistFormData.set({ name: a.name, photo: a.photo ?? '', bio: a.bio ?? '' });
    this.showArtistForm.set(true);
  }

  submitArtistForm() {
    this.artistFormError.set('');
    const d = this.artistFormData();
    if (!d.name?.trim()) {
      this.artistFormError.set('O nome do artista é obrigatório.');
      return;
    }

    this.artistFormLoading.set(true);
    const req = this.artistFormMode() === 'create'
      ? this.adminSvc.createArtist(d)
      : this.adminSvc.updateArtist(this.editingArtistId()!, d);

    req.subscribe({
      next: () => { this.artistFormLoading.set(false); this.showArtistForm.set(false); this.loadArtists(); },
      error: (err) => { this.artistFormLoading.set(false); this.artistFormError.set(err?.error?.error ?? 'Erro ao guardar.'); },
    });
  }

  openDeleteArtist(a: ArtistRecord) { this.deletingArtist.set(a); this.showArtistDelete.set(true); }

  confirmDeleteArtist() {
    const a = this.deletingArtist();
    if (!a) return;
    this.artistDeleteLoading.set(true);
    this.adminSvc.deleteArtist(a.id).subscribe({
      next: () => { this.artistDeleteLoading.set(false); this.showArtistDelete.set(false); this.loadArtists(); },
      error: () => this.artistDeleteLoading.set(false),
    });
  }

  patchArtistForm(field: keyof ArtistPayload, value: string) {
    this.artistFormData.update(d => ({ ...d, [field]: value }));
  }

  onArtistPhotoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.patchArtistForm('photo_data', reader.result as string);
    reader.readAsDataURL(file);
  }

  /** Caminhos locais (/api/uploads/...) precisam do apiBase em dev */
  resolvePhoto = resolveAsset;

  artistPhotoPreview(): string {
    const d = this.artistFormData();
    return d.photo_data || this.resolvePhoto(d.photo);
  }

  // ── Obra: artistas e imagem ──────────────────────────────────────────────────

  toggleArtist(id: number) {
    this.formData.update(d => ({
      ...d,
      artist_ids: d.artist_ids.includes(id)
        ? d.artist_ids.filter(x => x !== id)
        : [...d.artist_ids, id],
    }));
  }

  onArtworkImageSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.formData.update(d => ({ ...d, image_data: reader.result as string }));
    reader.readAsDataURL(file);
  }

  artworkImagePreview(): string {
    const d = this.formData();
    return d.image_data || this.resolvePhoto(d.image);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  patchForm(field: keyof ArtworkPayload, value: string | number) {
    this.formData.update(d => ({ ...d, [field]: value }));
  }
}
