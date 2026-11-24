import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { compare, hash } from 'bcryptjs'
import type { Request, Response } from 'express'
import type { RowDataPacket } from 'mysql2'
import { DatabaseService } from '../database/database.service'

interface UserRow extends RowDataPacket {
  id: number
  email: string
  password_hash: string
  name: string | null
  date_of_birth: Date | string | null
  language: string
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly database: DatabaseService,
  ) {}

  async register(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail || !password) {
      throw new BadRequestException('Email and password are required')
    }

    const [users] = await this.database.pool.execute<UserRow[]>(
      'SELECT id FROM users WHERE email = ?',
      [normalizedEmail],
    )

    if (users.length > 0) {
      throw new ConflictException('Email is already registered')
    }

    const passwordHash = await hash(password, 10)

    try {
      await this.database.pool.execute(
        'INSERT INTO users (email, password_hash) VALUES (?, ?)',
        [normalizedEmail, passwordHash],
      )
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'ER_DUP_ENTRY'
      ) {
        throw new ConflictException('Email is already registered')
      }
      throw error
    }

    return { message: 'Account created' }
  }

  async login(email: string, password: string, response: Response) {
    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail || !password) {
      throw new BadRequestException('Email and password are required')
    }

    const [users] = await this.database.pool.execute<UserRow[]>(
      'SELECT id, email, password_hash, name, date_of_birth, language FROM users WHERE email = ?',
      [normalizedEmail],
    )

    const user = users[0]
    if (!user || !(await compare(password, user.password_hash))) {
      throw new UnauthorizedException('Invalid email or password')
    }

    const token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    })

    response.cookie('auth_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    })

    return this.publicUser(user)
  }

  async me(request: Request) {
    const user = await this.getAuthenticatedUser(request)
    return this.publicUser(user)
  }

  async updateProfile(
    request: Request,
    body: { name?: string; dateOfBirth?: string; language?: string },
  ) {
    const current = await this.getAuthenticatedUser(request)

    const name = body.name?.trim() ?? current.name ?? null
    const language = body.language?.trim() ?? current.language

    if (name !== null && name.length > 100) {
      throw new BadRequestException('Name is too long')
    }
    if (!['et', 'ru', 'en'].includes(language)) {
      throw new BadRequestException('Language must be et, ru or en')
    }

    let dateOfBirth: string | null
    if (body.dateOfBirth === undefined) {
      dateOfBirth = current.date_of_birth
        ? new Date(current.date_of_birth).toISOString().slice(0, 10)
        : null
    } else if (body.dateOfBirth === '') {
      dateOfBirth = null
    } else {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(body.dateOfBirth)) {
        throw new BadRequestException('A valid date of birth is required')
      }
      dateOfBirth = body.dateOfBirth
    }

    await this.database.pool.execute(
      'UPDATE users SET name = ?, date_of_birth = ?, language = ? WHERE id = ?',
      [name, dateOfBirth, language, current.id],
    )

    const [rows] = await this.database.pool.execute<UserRow[]>(
      'SELECT id, email, name, date_of_birth, language FROM users WHERE id = ?',
      [current.id],
    )

    return this.publicUser(rows[0])
  }

  private async getAuthenticatedUser(request: Request) {
    const token = request.cookies?.auth_token
    if (!token) throw new UnauthorizedException('Authentication required')

    let payload: { sub?: number }
    try {
      payload = await this.jwtService.verifyAsync(token)
    } catch {
      throw new UnauthorizedException('Invalid or expired session')
    }

    if (!payload.sub) throw new UnauthorizedException('Authentication required')

    const [rows] = await this.database.pool.execute<UserRow[]>(
      'SELECT id, email, name, date_of_birth, language, password_hash FROM users WHERE id = ?',
      [payload.sub],
    )

    const user = rows[0]
    if (!user) throw new UnauthorizedException('User not found')
    return user
  }

  private publicUser(user: UserRow) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      dateOfBirth: user.date_of_birth
        ? new Date(user.date_of_birth).toISOString().slice(0, 10)
        : null,
      language: user.language,
    }
  }
}
