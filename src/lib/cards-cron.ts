import { Patterns, type CronConfig } from "@elysiajs/cron";
import { prisma } from "../helpers/prisma.client";
export function RankingCron(): CronConfig {
    return {
        name: "card",
        pattern: Patterns.everyDayAt('06:00'),
        async run() {
            
        }
    }
}