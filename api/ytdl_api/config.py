import pkg_resources
from pathlib import Path
from typing import Any, Dict, Optional, List
from enum import Enum

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseSettings, root_validator, validator
from starlette.middleware import Middleware

from .logger import log


class DbTypes(str, Enum):
    MEMORY = "memory"
    DETA = "deta"


class DownloadersTypes(str, Enum):
    YOUTUBE_DL = "youtube_dl"
    PYTUBE = "pytube"
    MOCK = "mock"


class Settings(BaseSettings):
    """
    Application settings config
    """

    debug: bool = False
    docs_url: str = "/docs"
    openapi_prefix: str = ""
    openapi_url: str = "/openapi.json"
    redoc_url: str = "/redoc"
    title: str = "YTDL API"
    description: str = "API for YTDL backend server."
    version: str = pkg_resources.get_distribution("ytdl-api").version
    disable_docs: bool = False
    allow_origins: List[str]

    # Path to directory where downloaded medias will be stored
    media_path: Path
    # Type of database to use
    db_type: DbTypes
    # Type of downloader
    downloader_type: DownloadersTypes = DownloadersTypes.YOUTUBE_DL
    # Deta project key
    deta_key: Optional[str]
    # Deta base name
    deta_base: Optional[str]

    @root_validator
    def validate_deta_db(cls, values):
        db_type = values.get("db_type")
        if db_type == DbTypes.DETA:
            deta_key = values.get("deta_key")
            if not deta_key:
                raise ValueError("Deta key is required when using Deta Base service")
        return values

    @validator("media_path")
    def validate_media_path(cls, value):
        media_path = Path(value)
        if not media_path.exists():  # pragma: no cover
            print(f'Media path "{value}" does not exist...Creating...')
            media_path.mkdir(parents=True)
        return value

    def init_app(__pydantic_self__) -> FastAPI:
        """
        Generate FastAPI instance.
        """
        kwargs: Dict[str, Any] = {
            "debug": __pydantic_self__.debug,
            "docs_url": __pydantic_self__.docs_url,
            "openapi_prefix": __pydantic_self__.openapi_prefix,
            "openapi_url": __pydantic_self__.openapi_url,
            "redoc_url": __pydantic_self__.redoc_url,
            "title": __pydantic_self__.title,
            "description": __pydantic_self__.description,
            "version": __pydantic_self__.version,
            "middleware": [
                Middleware(
                    CORSMiddleware,
                    allow_origins=__pydantic_self__.allow_origins,
                    allow_credentials=True,
                    allow_methods=["*"],
                    allow_headers=["*"],
                    expose_headers=["Content-Disposition"],
                ),
            ],
        }
        if __pydantic_self__.disable_docs:
            kwargs.update({"docs_url": None, "openapi_url": None, "redoc_url": None})
        app = FastAPI(**kwargs)
        log.info(f"Using database: {__pydantic_self__.db_type}")
        log.info(f"Using downloader: {__pydantic_self__.downloader_type}")
        __pydantic_self__.__setup_endpoints(app)
        __pydantic_self__.__setup_exception_handlers(app)
        return app

    def __setup_endpoints(__pydantic_self__, app: FastAPI):
        from .endpoints import router

        app.include_router(router, prefix="/api")

    def __setup_exception_handlers(__pydantic_self__, app: FastAPI):
        from .exceptions import ERROR_HANDLERS

        for error, handler in ERROR_HANDLERS:
            app.add_exception_handler(error, handler)

    # In order to avoid TypeError: unhashable type: 'Settings' when overidding
    # dependencies.get_settings in tests.py __hash__ should be implemented
    def __hash__(self):  # make hashable BaseModel subclass
        attrs = tuple(
            attr if not isinstance(attr, list) else ",".join(attr)
            for attr in self.__dict__.values()
        )
        return hash((type(self),) + attrs)

    class Config:
        allow_mutation = True
        case_sensitive = False
