import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { withAsyncFetchedData } from "@/components/hoc/with-data"
import { RankingView } from '@/modules/ranking';

type Ranking = {
    total_rarity: number;
    position: number;
    user: {
        username: string;
        picture: string;
        id: string;
    }
}

export default ({ searchParams }: {
    searchParams: { page: string | null }
}) => {
    const page = searchParams.page ?? '1'
    const Page = withAsyncFetchedData(RankingView, '/ranking?page=' + page)
    return <Page />
}