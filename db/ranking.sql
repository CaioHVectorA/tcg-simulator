SELECT 
    u.id,
    u.username,
    COALESCE(SUM(c.rarity), 0) AS total_rarity
FROM 
    users u
LEFT JOIN 
    cards_user cu ON u.id = cu.userId
LEFT JOIN 
    cards c ON cu.cardId = c.id
GROUP BY 
    u.id, u.username -- Inclua aqui todos os campos que não são agregados
ORDER BY 
total_rarity ASC
LIMIT 10;