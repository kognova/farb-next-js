import {
  Controller,
  Post,
  Body,
  Session,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {
    console.log('AuthController instantiated');
  }

  @Post('login')
  login(
    @Body() body: { username: string; password: string },
    @Session() session: any,
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

  @Post('logout')
  logout(@Session() session: any) {
    session.destroy();
    return { message: 'Logged out successfully' };
  }
}
