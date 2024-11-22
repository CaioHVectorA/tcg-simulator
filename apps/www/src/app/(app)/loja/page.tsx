import { withAsyncFetchedData } from "@/components/hoc/with-data"

function Loja({ data }: { data: any }) {
    return <>{JSON.stringify(data)}</>
}

export default withAsyncFetchedData(Loja, '/cards');