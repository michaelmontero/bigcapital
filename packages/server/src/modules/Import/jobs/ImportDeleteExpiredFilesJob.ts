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
      
      // Get all initialized tenants using TenantModel
      const tenants = await (this.tenantModel as any)
        .query()
        .whereNotNull('initializedAt');
      
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
