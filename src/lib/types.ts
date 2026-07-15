export interface TurfListItem {
  id: string;
  name: string;
  city: string;
  area: string | null;
  sportType: string;
  pricePerHour: number;
  images: string[];
  lat: number | null;
  lng: number | null;
}
