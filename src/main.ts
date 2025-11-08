import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import basicAuth from 'express-basic-auth';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const authOptions = {
    challenge: true,
    users: {
      fatima: 'fatima123',
    },
    authorizeAsync: false,
    unauthorizedResponse: 'Unauthorized',
  };
  app.use('/api', basicAuth(authOptions));

  const config = new DocumentBuilder()
    .setTitle('TECHNICAL TASK API')
    .setDescription(
      'simplified Fintech Payment Gateway API using NestJS and MongoDB, with a focus on secure data handling (PCI DSS awareness) and audit logging for critical actions.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const whitelist = ['http://localhost:3050', 'http://127.0.0.1:3050'];
  app.enableCors({
    origin: function (origin, callback) {
      if (!origin || whitelist.indexOf(origin) !== -1) {
        callback(null, origin);
      } else callback(new Error('Not allowed by CORS'));
    },

    credentials: true,
  });
  app.use(helmet());
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  await app.listen(3050);
}
bootstrap();
