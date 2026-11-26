import { Injectable, OnModuleDestroy } from '@nestjs/common';
import mysql from 'mysql2/promise';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly bookingLoad = process.env.KINO_BOOKING_LOAD === '1';
  readonly pool = mysql.createPool({
    host: this.bookingLoad ? '127.0.0.1' : (process.env.DB_HOST ?? '127.0.0.1'),
    port: this.bookingLoad ? 3315 : Number(process.env.DB_PORT ?? '3308'),
    user: this.bookingLoad ? 'artillery' : (process.env.DB_USER ?? 'kino_user'),
    password: this.bookingLoad ? 'artillery_local' : process.env.DB_PASSWORD,
    database: this.bookingLoad ? 'kino_artillery' : (process.env.DB_NAME ?? 'kino'),
    waitForConnections: true,
    connectionLimit: 10,
  });

  async onModuleDestroy() {
    await this.pool.end();
  }
}
