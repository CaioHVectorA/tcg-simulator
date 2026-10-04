import { withAsyncFetchedData } from "@/components/hoc/with-data";
import { InventoryPage } from "@/modules/inventory/packages";

export const dynamic = "force-dynamic";

export default withAsyncFetchedData(InventoryPage, "/packages");