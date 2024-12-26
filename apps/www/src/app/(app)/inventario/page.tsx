import { withAsyncFetchedData } from "@/components/hoc/with-data"
import { InventoryPage } from "@/modules/inventory/packages"

export default withAsyncFetchedData(InventoryPage, '/packages')