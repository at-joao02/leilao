export interface Countdown {
  expired: boolean;
  seconds: number;
  formatted: string;
}

export interface Artwork {
  id: number;
  title: string;
  artist: string;
  description: string;
  image: string;
  starting_price: number;
  current_price: number;
  auction_end: string;
  dimensions?: string | null;
  is_active: 0 | 1;
  total_bids: number;
  countdown: Countdown;
}

export interface ArtworkArtist {
  id: number;
  name: string;
}

export interface ArtistRecord {
  id: number;
  name: string;
  photo: string | null;
  bio: string | null;
}

export interface ArtistPayload {
  name: string;
  photo?: string;
  bio?: string;
  /** Data URL base64 da nova fotografia a carregar */
  photo_data?: string;
}

export interface Bid {
  id: number;
  amount: number;
  created_at: string;
  bidder_name: string;
}

export interface ArtworkDetail extends Artwork {
  artists: ArtworkArtist[];
  bids: Bid[];
}

export interface BidPayload {
  name: string;
  phone?: string;
  amount: number;
}

export interface BidResponse {
  message: string;
  artwork_id: number;
  new_price: number;
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export interface AdminArtwork extends Artwork {
  top_bid: number | null;
  artist_ids: number[];
}

export interface AdminBid {
  id: number;
  amount: number;
  created_at: string;
  name: string;
  email: string;
  phone: string | null;
}

export interface AdminBidsResponse {
  artwork: Artwork;
  bids: AdminBid[];
}

export interface AdminSettings {
  notification_email: string;
}

export interface ArtworkPayload {
  title: string;
  artist_ids: number[];
  description: string;
  image: string;
  /** Data URL base64 da nova imagem a carregar */
  image_data?: string;
  dimensions?: string;
  starting_price: number;
  current_price?: number;
  auction_end: string;
}
