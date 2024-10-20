import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as session from 'express-session';
import * as dotenv from 'dotenv';

async function bootstrap() {
  dotenv.config();
  const app = await NestFactory.create(AppModule);

  app.use(
    session({
      secret: process.env.SESSION_SECRET ?? 'my-secret',
      resave: false,
      saveUninitialized: false,
    }),
  );

  app.enableCors({
    origin: '*',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3001, process.env.NEST_HOST);

  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
