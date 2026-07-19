from pydantic import BaseModel, EmailStr, field_validator


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if len(v) > 128:
            raise ValueError("Password too long")
        return v

    @field_validator("full_name")
    @classmethod
    def name_length(cls, v: str) -> str:
        if len(v.strip()) < 1:
            raise ValueError("Name is required")
        if len(v) > 100:
            raise ValueError("Name too long")
        return v.strip()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_max(cls, v: str) -> str:
        if len(v) > 128:
            raise ValueError("Invalid credentials")
        return v


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
