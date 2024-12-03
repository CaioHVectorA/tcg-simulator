import { withAsyncPaginatedFetchedData } from '@/components/hoc/with-paginated-data'
import { api } from '@/lib/api'
import { withToken } from '@/lib/with-token'
import { Cards } from '@/modules/colection/'
import { redirect } from 'next/navigation'
import { checkDomainOfScale } from 'recharts/types/util/ChartUtils'

export default withAsyncPaginatedFetchedData(Cards, '/cards/my')