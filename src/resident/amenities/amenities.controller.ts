import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/current-user.decorator';
import { Role } from '../../common/role.enum';
import { Roles } from '../../common/roles.decorator';
import { RolesGuard } from '../../common/roles.guard';
import { AmenitiesService } from './amenities.service';
import { BookAmenityDto } from './dto/book-amenity.dto';

@ApiTags('Resident')
@ApiSecurity('x-role')
@ApiSecurity('x-user-id')
@Controller('resident/amenities')
@UseGuards(RolesGuard)
@Roles(Role.RESIDENT)
export class AmenitiesController {
  constructor(private readonly amenities: AmenitiesService) {}

  @Get()
  list() {
    return this.amenities.findAll(true);
  }

  @Post('bookings')
  book(@CurrentUser() user: AuthUser, @Body() dto: BookAmenityDto) {
    return this.amenities.book(user.id, dto);
  }

  @Get('bookings')
  myBookings(@CurrentUser() user: AuthUser) {
    return this.amenities.listForResident(user.id);
  }

  @Delete('bookings/:id')
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.amenities.cancel(user.id, id);
  }
}
