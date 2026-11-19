import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Amenity, AmenityBooking, BookingStatus } from './amenity.types';
import { BookAmenityDto } from './dto/book-amenity.dto';
import { CreateAmenityDto } from './dto/create-amenity.dto';

@Injectable()
export class AmenitiesService {
  private readonly amenities = new Map<string, Amenity>();
  private readonly bookings = new Map<string, AmenityBooking>();

  constructor() {
    // Demo seed
    this.create({ name: 'Clubhouse', description: 'Party hall with kitchenette', capacity: 1, openTime: '08:00', closeTime: '22:00' });
    this.create({ name: 'Gym', description: 'Fully equipped gym', capacity: 10, openTime: '05:00', closeTime: '22:00' });
    this.create({ name: 'Swimming Pool', description: 'Adults and kids pool', capacity: 15, openTime: '06:00', closeTime: '20:00' });
  }

  create(dto: CreateAmenityDto): Amenity {
    if (dto.openTime >= dto.closeTime) {
      throw new BadRequestException('openTime must be earlier than closeTime');
    }
    const amenity: Amenity = { id: randomUUID(), active: true, ...dto };
    this.amenities.set(amenity.id, amenity);
    return amenity;
  }

  findAll(onlyActive = false): Amenity[] {
    const all = [...this.amenities.values()];
    return onlyActive ? all.filter((a) => a.active) : all;
  }

  findOne(id: string): Amenity {
    const amenity = this.amenities.get(id);
    if (!amenity) throw new NotFoundException(`Amenity ${id} not found`);
    return amenity;
  }

  setActive(id: string, active: boolean): Amenity {
    const amenity = this.findOne(id);
    amenity.active = active;
    return amenity;
  }

  book(residentId: string, dto: BookAmenityDto): AmenityBooking {
    const amenity = this.findOne(dto.amenityId);
    if (!amenity.active) throw new BadRequestException('This amenity is currently unavailable');
    if (dto.startTime >= dto.endTime) throw new BadRequestException('startTime must be earlier than endTime');
    if (dto.startTime < amenity.openTime || dto.endTime > amenity.closeTime) {
      throw new BadRequestException(`${amenity.name} is open ${amenity.openTime} - ${amenity.closeTime}`);
    }

    const overlapping = [...this.bookings.values()].filter(
      (b) =>
        b.amenityId === amenity.id &&
        b.date === dto.date &&
        b.status === BookingStatus.CONFIRMED &&
        b.startTime < dto.endTime &&
        dto.startTime < b.endTime,
    ).length;
    if (overlapping >= amenity.capacity) throw new ConflictException('That slot is fully booked');

    const booking: AmenityBooking = {
      id: randomUUID(),
      amenityId: amenity.id,
      amenityName: amenity.name,
      residentId,
      date: dto.date,
      startTime: dto.startTime,
      endTime: dto.endTime,
      status: BookingStatus.CONFIRMED,
      createdAt: new Date().toISOString(),
    };
    this.bookings.set(booking.id, booking);
    return booking;
  }

  listForResident(residentId: string): AmenityBooking[] {
    return [...this.bookings.values()].filter((b) => b.residentId === residentId);
  }

  listAllBookings(): AmenityBooking[] {
    return [...this.bookings.values()];
  }

  cancel(residentId: string, bookingId: string): AmenityBooking {
    const booking = this.bookings.get(bookingId);
    if (!booking) throw new NotFoundException(`Booking ${bookingId} not found`);
    if (booking.residentId !== residentId) throw new ForbiddenException('Not your booking');
    booking.status = BookingStatus.CANCELLED;
    return booking;
  }
}
