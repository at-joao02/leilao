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
  is_active: 0 | 1;
  total_bids: number;
  countdown: Countdown;
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
  company: string | null;
}

export interface ArtworkDetail extends Artwork {
  bids: Bid[];
}

export interface BidPayload {
  name: string;
  email: string;
  company?: string;
  amount: number;
  is_anonymous: boolean;
}

export interface BidResponse {
  message: string;
  artwork_id: number;
  new_price: number;
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export interface AdminArtwork extends Artwork {
  top_bid: number | null;
}

export interface AdminBid {
  id: number;
  amount: number;
  created_at: string;
  name: string;
  email: string;
  company: string | null;
  is_anonymous: 0 | 1;
}

export interface AdminBidsResponse {
  artwork: Artwork;
  bids: AdminBid[];
}

export interface ArtworkPayload {
  title: string;
  artist: string;
  description: string;
  image: string;
  starting_price: number;
  current_price?: number;
  auction_end: string;
}
