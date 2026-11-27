import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Module,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { DatabaseService } from '../database/database.service';

@Controller('api/load-test/sessions/:sessionId/bookings')
class BookingLoadController {
  constructor(private readonly database: DatabaseService) {}

  @Post()
  async book(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body('seat') seat: unknown,
  ) {
    if (typeof seat !== 'string' || !/^[A-E]-[1-9][0-9]?$/.test(seat)) {
      throw new BadRequestException('Invalid seat');
    }

    try {
      await this.database.pool.execute(
        'INSERT INTO artillery_bookings (session_id, seat) VALUES (?, ?)',
        [sessionId, seat],
      );
    } catch (error) {
      if ((error as { code?: string }).code === 'ER_DUP_ENTRY') {
        throw new ConflictException('Seat already booked');
      }
      throw error;
    }

    return { sessionId, seat };
  }
}

@Module({
  imports: [DatabaseModule],
  controllers: [BookingLoadController],
})
export class BookingLoadModule {}
