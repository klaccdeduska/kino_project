import { Body, Controller, Get, Post, Put, Req, Res } from '@nestjs/common'
import type { Request, Response } from 'express'
import { AuthService } from './auth.service'
import { CredentialsPipe } from './credentials.pipe'
import type { Credentials } from './credentials.pipe'

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  register(@Body(CredentialsPipe) body: Credentials) {
    return this.authService.register(body.email, body.password)
  }

  @Post('login')
  login(
    @Body(CredentialsPipe) body: Credentials,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.login(body.email, body.password, response
    )
  }

  @Get('me')
  me(@Req() request: Request) {
    return this.authService.me(request)
  }

  @Put('profile')
  updateProfile(
    @Req() request: Request,
    @Body() body: { name?: string; dateOfBirth?: string; language?: string },
  ) {
    return this.authService.updateProfile(request, body)
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('auth_token', { path: '/' })
    return { message: 'Logged out' }
  }
}