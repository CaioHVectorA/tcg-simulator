import { Quests } from "@/modules/inventory/quests";

export default function QuestsPage() {
    return (
        <>
            {/* <h2 className="text-2xl font-bold my-4">Missões Ativas</h2> */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 px-4 gap-6">
                <Quests />
            </div>
        </>
    )

}