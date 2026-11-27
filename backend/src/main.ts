import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { BookingLoadModule } from './booking-load/booking-load.module';

async function bootstrap() {
  const bookingLoad = process.env.KINO_BOOKING_LOAD === '1';
  const app = await NestFactory.create(
    bookingLoad ? BookingLoadModule : AppModule,
  );

  app.use(cookieParser());
  app.enableShutdownHooks();

  const frontendUrl = process.env.FRONTEND_URL;
  if (frontendUrl) app.enableCors({ origin: frontendUrl, credentials: true });

  if (bookingLoad) {
    await app.listen(3105, '127.0.0.1');
  } else {
    await app.listen(process.env.PORT ?? 3000);
  }
}

void bootstrap();
