from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


def normalize_email(email: str) -> str:
    return email.strip().lower()


async def upsert_user_by_email(db: AsyncSession, email: str) -> User:
    normalized_email = normalize_email(email)

    stmt = (
        insert(User)
        .values(email=normalized_email)
        .on_conflict_do_update(
            index_elements=[User.email],
            set_={"updated_at": func.now()},
        )
        .returning(User.id)
    )

    result = await db.execute(stmt)
    user_id = result.scalar_one()
    await db.commit()

    user = await db.scalar(select(User).where(User.id == user_id))

    if user is None:
        raise RuntimeError("Failed to load upserted user")

    return user
