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
          connectTimeout: 10000, // 10 seconds - time to establish connection
          enableKeepAlive: true,
          keepAliveInitialDelay: 0,
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
      const knex = Knex(knexConfig);
      // Log connection details (without password) for debugging
      console.log('System database connection configured:', {
        host: knexConfig.connection.host,
        port: knexConfig.connection.port,
        database: knexConfig.connection.database,
        user: knexConfig.connection.user,
      });
      return knex;
    },
  },
];

@Global()
@Module({
  providers: [...providers],
  exports: [...providers],
})
export class SystemDatabaseModule {}
