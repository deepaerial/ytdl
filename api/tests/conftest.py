from confz import ConfZDataSource
import pytest
from pathlib import Path
from typing import Iterable
from tempfile import TemporaryDirectory
from fastapi.testclient import TestClient
from fastapi import BackgroundTasks

from ytdl_api.dependencies import get_database, get_settings
from ytdl_api.datasource import IDataSource, InMemoryDB
from ytdl_api.config import Settings
from ytdl_api.queue import NotificationQueue
from ytdl_api.downloaders import YoutubeDLDownloader, PytubeDownloader, get_unique_id


@pytest.fixture()
def uid() -> str:
    return get_unique_id()


@pytest.fixture
def temp_directory():
    tmp = TemporaryDirectory()
    yield tmp
    tmp.cleanup()


@pytest.fixture
def fake_media_path(temp_directory: TemporaryDirectory):
    return Path(temp_directory.name)


@pytest.fixture
def download_params() -> YTDLParams:
    return YTDLParams(
        url="https://www.youtube.com/watch?v=rsd4FNGTRBw", media_format="mp4"
    )



@pytest.fixture
def fake_db():
    return InMemoryDB()


@pytest.fixture
def event_queue():
    return NotificationQueue()


@pytest.fixture
def task_queue():
    return BackgroundTasks()


@pytest.fixture
def youtube_dl_downloader(fake_media_path, fake_db, task_queue):
    return YoutubeDLDownloader(
        media_path=fake_media_path,
        datasource=fake_db,
        event_queue=NotificationQueue(DownloadersTypes.YOUTUBE_DL),
        task_queue=task_queue,
    )


@pytest.fixture()
def mock_datasource() -> IDataSource:
    return InMemoryDB()


@pytest.fixture()
def settings() -> Iterable[Settings]:
    data_source = ConfZDataSource(data={"datasource_config": {"in_memory": True}})
    with Settings.change_config_sources(data_source):
        yield Settings() # type: ignore


@pytest.fixture
def app_client(settings: Settings, mock_database: IDataSource):
    app = settings.init_app()
    app.dependency_overrides[get_settings] = lambda: settings
    app.dependency_overrides[get_database] = lambda: mock_database
    return TestClient(app)
