import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { FilesModule } from './files/files.module';
import { AuthModule } from './auth/auth.module';
import { AnalysisModule } from './analysis/analysis.module';
import { UsersModule } from './users/users.module';
import { STATIC_DIR } from './static';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: STATIC_DIR,
    }),
    FilesModule,
    AuthModule,
    AnalysisModule,
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
