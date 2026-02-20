import { reportsSearchParamsCache } from '../searchparams';
import { getRecentExports } from '../data/get-recent-exports';
import { RecentReportsTable } from './recent-reports-table';

export default async function RecentReportsListing() {
  const page = reportsSearchParamsCache.get('page');
  const perPage = reportsSearchParamsCache.get('perPage');

  const result = await getRecentExports({ page, limit: perPage });

  const data = result?.data?.data ?? [];
  const totalCount = result?.data?.totalCount ?? 0;
  const pageCount = Math.ceil(totalCount / perPage);

  return (
    <RecentReportsTable
      data={data}
      totalCount={totalCount}
      pageCount={pageCount}
    />
  );
}
