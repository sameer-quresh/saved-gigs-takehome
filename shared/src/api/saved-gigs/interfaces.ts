export interface SavedGigItem {
  id: number;
  gig_id: number;
  gig_title: string;
  gig_status: string;
  list: string;
  note: string | null;
  created_on: string;
  updated_on: string;
}

export interface ListSavedGigs {
  items: SavedGigItem[];
  total: number;
}

export interface SaveSavedGigResponse {
  id: number;
  gig_id: number;
  list: string;
  note: string | null;
  created_on: string;
  updated_on: string;
}
