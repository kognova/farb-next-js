import {
  Controller,
  Post,
  Body,
  Session,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Get } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  login(
    @Body() body: { username: string; password: string },
    @Session() session: Record<string, any>,
  ) {
    console.log('Login attempt:', body);
    try {
      const { username, password } = body;
      if (this.authService.validateUser(username, password)) {
        session.user = { username };
        return { message: 'Login successful' };
      } else {
        throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('status')
  status(@Session() session: Record<string, any>) {
    if (session.user) {
      return { isLoggedIn: true, user: session.user };
    } else {
      return { isLoggedIn: false };
    }
  }

  @Post('logout')
  logout(@Session() session: Record<string, any>) {
    session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
      }
    });
    return { message: 'Logged out successfully' };
  }
}
