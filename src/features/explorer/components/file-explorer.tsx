import { resolveActionResult } from '@/lib/actions/client';
import { getFiles } from '../data/get-files';
import { FileList } from './file-list';
import { FileBreadcrumbs } from './file-breadcrumbs';
import { searchParamsCache } from '../searchparams';

export async function FileExplorer() {
  const path = searchParamsCache.get('path');
  const data = await resolveActionResult(getFiles({ path }));

  return (
    <div className='space-y-4'>
      <FileBreadcrumbs currentPath={data.currentPath} />

      <FileList files={data.files} currentPath={data.currentPath} />
    </div>
  );
}
