import { Injectable } from '@nestjs/common';
import { AppSettings } from './app-settings.types';
import { UpdateAppConfigDto } from './dto/update-app-config.dto';

@Injectable()
export class AppConfigService {
  private settings: AppSettings = {
    societyName: 'MyHome',
    visitorPassValidityHours: 24,
    maintenanceDueDay: 5,
    amenityBookingAdvanceDays: 7,
    features: { amenityBooking: true, onlinePayments: true, incidentReporting: true },
  };

  get(): AppSettings {
    return this.settings;
  }

  /** Subset that is safe to expose to the mobile apps without authentication. */
  getPublic() {
    return { societyName: this.settings.societyName, features: this.settings.features };
  }

  update(dto: UpdateAppConfigDto): AppSettings {
    const { features, ...rest } = dto;
    this.settings = {
      ...this.settings,
      ...rest,
      features: { ...this.settings.features, ...(features ?? {}) },
    };
    return this.settings;
  }
}
