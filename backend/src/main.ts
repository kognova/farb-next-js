import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as session from 'express-session';
import * as dotenv from 'dotenv';

async function bootstrap() {
  dotenv.config();
  const app = await NestFactory.create(AppModule);

  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'my-secret',
      resave: false,
      saveUninitialized: false,
    }),
  );

  app.enableCors({
    origin: 'http://localhost:3000', // Changed from 3001 to 3000
    credentials: true,
  });

  await app.listen(3001);
}
bootstrap();
