import { Module } from '@nestjs/common';
import { MoviesModule } from './movies/movies.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [AuthModule, MoviesModule],
})
export class AppModule {}
