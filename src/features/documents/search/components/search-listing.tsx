import { searchParamsCache } from '@/features/search/searchparams';
import { SearchTable } from './search-table';
import { resolveActionResult } from '@/lib/actions/client';
import { getDocuments } from '../data/get-documents';

export default async function SearchListing() {
  const page = searchParamsCache.get('page');
  const pageLimit = searchParamsCache.get('perPage');
  const q = searchParamsCache.get('q');
  const year = searchParamsCache.get('year');
  const classification = searchParamsCache.get('classification');
  const subClassification = searchParamsCache.get('subClassification');
  const fileType = searchParamsCache.get('fileType');

  const filters = {
    page,
    limit: pageLimit,
    ...(q && { q }),
    ...(year && { year }),
    ...(classification && { classification }),
    ...(subClassification && { subClassification }),
    ...(fileType && { fileType })
  };

  const data = await resolveActionResult(getDocuments(filters));

  return <SearchTable data={data.documents} pagination={data.pagination} />;
}
