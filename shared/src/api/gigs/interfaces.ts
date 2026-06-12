export interface GigListItem {
  id: number;
  title: string;
  description: string;
  budget_amount: number;
  mode: string;
  status: string;
  posted_by: number;
  created_on: string;
  is_saved: boolean;
}

export interface ListGigs {
  items: GigListItem[];
  total: number;
}
