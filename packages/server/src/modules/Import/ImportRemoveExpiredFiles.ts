import * as moment from 'moment';
import * as bluebird from 'bluebird';
import { deleteImportFile } from './_utils';
import { Inject, Injectable } from '@nestjs/common';
import { ImportModel } from './models/Import';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';

@Injectable()
export class ImportDeleteExpiredFiles {
  constructor(
    @Inject(ImportModel.name)
    private readonly importModel: TenantModelProxy<typeof ImportModel>,
  ) {}
  /**
   * Delete expired files.
   */
  async deleteExpiredFiles() {
    const yesterday = moment().subtract(1, 'hour').format('YYYY-MM-DD HH:mm');
    
    // Get the model instance for the current tenant context
    const model = this.importModel() as any;

    const expiredImports = await model
      .query()
      .where('createdAt', '<', yesterday);

    await bluebird.map(
      expiredImports,
      async (expiredImport) => {
        await deleteImportFile(expiredImport.filename);
      },
      { concurrency: 10 },
    );
    const expiredImportsIds = expiredImports.map(
      (expiredImport) => expiredImport.id,
    );
    if (expiredImportsIds.length > 0) {
      await model
        .query()
        .whereIn('id', expiredImportsIds)
        .delete();
    }
  }
}
