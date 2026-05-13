import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from './config/configuration';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TemplatesModule } from './templates/templates.module';
import { LogsModule } from './logs/logs.module';
import { CardsModule } from './cards/cards.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { StatsModule } from './stats/stats.module';
import { NotificationsModule } from './notifications/notifications.module';
import { User } from './users/user.entity';
import { Template } from './templates/template.entity';
import { Log } from './logs/log.entity';
import { Card } from './cards/card.entity';
import { CardProgress } from './cards/card-progress.entity';
import { Submission } from './submissions/submission.entity';
import { DailyActivity } from './stats/daily-activity.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('database.url'),
        entities: [User, Template, Log, Card, CardProgress, Submission, DailyActivity],
        synchronize: true, // use migrations in production
        logging: false,
      }),
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    TemplatesModule,
    LogsModule,
    CardsModule,
    SubmissionsModule,
    StatsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
