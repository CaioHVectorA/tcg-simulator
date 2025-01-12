export function runQuery(query: string, goal: number, user_id: number) {
  return query
    .replace("$GOAL", goal.toString())
    .replace("$USER_ID", user_id.toString());
}
