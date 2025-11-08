import {
  Coffee,
  Utensils,
  ShoppingBag,
  Hotel,
  Dumbbell,
  Landmark,
  Store,
  Banknote,
  GraduationCap,
  Shirt,
  Stethoscope,
  Home,
  MapPin,
  Building,
  LucideIcon,
} from "lucide-react";

export const iconMap: { [key: string]: LucideIcon } = {
  café: Coffee,
  cafe: Coffee,
  coffee: Coffee,
  restaurant: Utensils,
  food: Utensils,
  hotel: Hotel,
  lodging: Hotel,
  gym: Dumbbell,
  bank: Banknote,
  shopping: ShoppingBag,
  store: Store,
  government: Landmark,
  school: GraduationCap,
  hospital: Stethoscope,
  clothing: Shirt,
  home: Home,
  building: Building,
  default: MapPin,
};

export type LocationSuggestion = {
  mapbox_id?: string;
  name: string;
  place_formatted?: string;
  maki?: string;
  full_address?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  center?: [number, number];
};

export type LocationFeature = {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: {
    name?: string;
    address?: string;
    place_name?: string;
    maki?: string;
    category?: string;
    [key: string]: unknown;
  };
};
