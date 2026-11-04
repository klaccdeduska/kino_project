import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CredentialsPipe } from './credentials.pipe';
import type { Credentials } from './credentials.pipe';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body(CredentialsPipe) body: Credentials) {
    return this.authService.register(body.email, body.password);
  }

  @Post('login')
  login(@Body(CredentialsPipe) body: Credentials) {
    return this.authService.login(body.email, body.password);
  }
}
