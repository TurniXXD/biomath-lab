from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List


async def vector_search(
    db: AsyncSession,
    query_embedding: List[float],
    top_k: int,
):
    query = text("""
        SELECT id,
               1 - (embedding <=> :embedding) AS score
        FROM items
        ORDER BY embedding <=> :embedding
        LIMIT :limit
    """)

    result = await db.execute(
        query,
        {
            "embedding": query_embedding,
            "limit": top_k,
        },
    )

    rows = result.fetchall()

    return [
        {"id": row.id, "score": float(row.score)}
        for row in rows
    ]