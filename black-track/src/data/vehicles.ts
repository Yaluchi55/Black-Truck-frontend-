import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';

export type VehicleIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface Vehicle {
  id: string;
  name: string;
  model: string;
  seats: number;
  etaMinutes: number;
  hourlyZmw: number;
  icon: VehicleIconName;
}

export const VEHICLES: Vehicle[] = [
  {
    id: 'sedan',
    name: 'Executive Sedan',
    model: 'Mercedes E-Class or similar',
    seats: 3,
    etaMinutes: 6,
    hourlyZmw: 1000,
    icon: 'car-side',
  },
  {
    id: 'suv',
    name: 'Premium SUV',
    model: 'Toyota Land Cruiser V8',
    seats: 4,
    etaMinutes: 9,
    hourlyZmw: 1600,
    icon: 'car-estate',
  },
  {
    id: 'truck',
    name: 'Signature Truck',
    model: 'Ford F-150 Platinum, blacked out',
    seats: 4,
    etaMinutes: 12,
    hourlyZmw: 2200,
    icon: 'car-pickup',
  },
  {
    id: 'van',
    name: 'Executive Van',
    model: 'Mercedes V-Class',
    seats: 6,
    etaMinutes: 14,
    hourlyZmw: 2000,
    icon: 'van-passenger',
  },
];
