from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    full_name: str


class UserProfile(BaseModel):
    id: str
    email: str
    full_name: str
    avatar_url: str | None
    brand_name: str | None
    brand_tone: str | None
    is_active: bool

    class Config:
        from_attributes = True
