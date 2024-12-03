import { withAsyncFetchedData } from "@/components/hoc/with-data";
import { StorePage } from "./store";

export default withAsyncFetchedData(StorePage, '/packages/all')