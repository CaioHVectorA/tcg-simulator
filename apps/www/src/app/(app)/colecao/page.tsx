import { withAsyncPaginatedFetchedData } from "@/components/hoc/with-paginated-data";
import { Cards } from "@/modules/colection";

export default withAsyncPaginatedFetchedData(Cards, "/cards/my");