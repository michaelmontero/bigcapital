import { Cron } from '@nestjs/schedule';
import { Injectable, Inject } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { ImportDeleteExpiredFiles } from '../ImportRemoveExpiredFiles';
import { TenantModel } from '../../System/models/TenantModel';

@Injectable()
export class ImportDeleteExpiredFilesJobs {
  constructor(
    private readonly importDeleteExpiredFiles: ImportDeleteExpiredFiles,
    private readonly cls: ClsService,
    @Inject(TenantModel.name)
    private readonly tenantModel: typeof TenantModel,
  ) {}

  /**
   * Triggers deleting expired import files for all tenants.
   */
  @Cron('* * * * *')
  async importDeleteExpiredJob() {
    try {
      console.log('Delete expired import files has started.');
      
      // Verify TenantModel is connected to a knex instance
      const modelKnex = (this.tenantModel as any).knex();
      if (!modelKnex) {
        console.error('TenantModel is not connected to a Knex instance. Skipping job.');
        return;
      }
      
      // Get all initialized tenants using TenantModel
      // Add timeout and error handling for connection issues
      let tenants;
      try {
        // Use a shorter timeout for the query itself
        tenants = await Promise.race([
          (this.tenantModel as any).query().whereNotNull('initializedAt'),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Query timeout after 10 seconds')), 10000)
          )
        ]) as any[];
      } catch (error: any) {
        // Log more details about the error
        if (error.code === 'ETIMEDOUT' || error.errorno === 'ETIMEDOUT') {
          console.error('Database connection timeout. This may indicate network issues or the database is not reachable.');
          console.error('Connection details:', {
            host: modelKnex?.client?.config?.connection?.host,
            database: modelKnex?.client?.config?.connection?.database,
          });
        } else {
          console.error('Error fetching tenants:', error.message || error);
        }
        return; // Exit early if we can't connect to the database
      }
      
      if (!tenants || tenants.length === 0) {
        console.log('No tenants found to process.');
        return;
      }
      
      // Process each tenant
      for (const tenant of tenants) {
        try {
          // Set tenant context
          this.cls.set('organizationId', tenant.organizationId);
          
          // Delete expired files for this tenant
          await this.importDeleteExpiredFiles.deleteExpiredFiles();
        } catch (error) {
          console.error(`Error processing tenant ${tenant.organizationId}:`, error);
          // Continue with next tenant
        }
      }
    } catch (error) {
      console.error('Error in importDeleteExpiredJob:', error);
    }
  }
}
