export interface Amenity {
  id: string;
  name: string;
  description: string;
  capacity: number; // max concurrent bookings per slot
  openTime: string; // HH:mm
  closeTime: string; // HH:mm
  active: boolean;
}

export enum BookingStatus {
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export interface AmenityBooking {
  id: string;
  amenityId: string;
  amenityName: string;
  residentId: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  status: BookingStatus;
  createdAt: string;
}
