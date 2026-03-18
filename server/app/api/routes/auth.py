from fastapi import APIRouter, Depends
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/user")
def read_me(user=Depends(get_current_user)):
    return {"user": user}