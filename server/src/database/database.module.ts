import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createDatabaseConnection, Database } from './database';

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DATABASE_CONNECTION,
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('database.url');
        return createDatabaseConnection(databaseUrl);
      },
      inject: [ConfigService],
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}

export { Database };
