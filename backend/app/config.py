from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/finance_tracker"

    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_whatsapp_from: str = "whatsapp:+14155238886"
    twilio_sms_from: str = ""

    sendgrid_api_key: str = ""
    sendgrid_from_email: str = "alerts@example.com"

    owner_email: str = "arulprakashu@gmail.com"
    owner_whatsapp: str = "+919597470788"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)


settings = Settings()
