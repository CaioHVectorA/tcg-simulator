export function runQuery(query: string, goal: number, user_id: number) {
  return query
    .replaceAll("$GOAL", goal.toString())
    .replaceAll("$USER_ID", user_id.toString());
}
