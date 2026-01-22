import Knex from 'knex';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SystemKnexConnection,
  SystemKnexConnectionConfigure,
} from './SystemDB.constants';
import { knexSnakeCaseMappers } from 'objection';

const providers = [
  {
    provide: SystemKnexConnectionConfigure,
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => {
      // Ensure mysql2 is used (required for MySQL 8.0+ authentication)
      const client = configService.get('systemDatabase.client') || 'mysql2';
      if (client !== 'mysql2') {
        console.warn(`Warning: Expected mysql2 client but got ${client}. Forcing mysql2.`);
      }
      return {
        client: 'mysql2', // Force mysql2 to support MySQL 8.0+ authentication
        connection: {
          host: configService.get('systemDatabase.host'),
          user: configService.get('systemDatabase.user'),
          password: configService.get('systemDatabase.password'),
          database: configService.get('systemDatabase.databaseName'),
          charset: 'utf8',
        },
      migrations: {
        directory: configService.get('systemDatabase.migrationDir'),
      },
      seeds: {
        directory: configService.get('systemDatabase.seedsDir'),
      },
        pool: { min: 0, max: 7 },
        ...knexSnakeCaseMappers({ upperCase: true }),
      };
    },
  },
  {
    provide: SystemKnexConnection,
    inject: [SystemKnexConnectionConfigure],
    useFactory: (knexConfig) => {
      return Knex(knexConfig);
    },
  },
];

@Global()
@Module({
  providers: [...providers],
  exports: [...providers],
})
export class SystemDatabaseModule {}
