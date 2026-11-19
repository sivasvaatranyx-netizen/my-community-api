export interface FeatureFlags {
  amenityBooking: boolean;
  onlinePayments: boolean;
  incidentReporting: boolean;
}

export interface AppSettings {
  societyName: string;
  visitorPassValidityHours: number;
  maintenanceDueDay: number; // day of month
  amenityBookingAdvanceDays: number;
  features: FeatureFlags;
}
