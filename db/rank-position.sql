SELECT 
    ranking.position,
    ranking.id,
    ranking.username,
    ranking.total_rarity
FROM (
    SELECT 
        u.id,
        u.username,
        COALESCE(SUM(c.rarity), 0) AS total_rarity,
        ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(c.rarity), 0) DESC, u.id ASC) AS position
    FROM 
        users u
    LEFT JOIN 
        cards_user cu ON u.id = cu.userId
    LEFT JOIN 
        cards c ON cu.cardId = c.id
    WHERE u.id = 142
    GROUP BY 
        u.id, u.username
) AS ranking
