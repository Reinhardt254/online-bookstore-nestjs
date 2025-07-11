import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable CORS
  app.enableCors({
    origin: configService.get<string>('cors.origin'),
    credentials: true,
  });

  // Set global prefix
  app.setGlobalPrefix('api');

  const port = configService.get<number>('port');
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
