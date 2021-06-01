import asyncio
import typing
import socket
import re
from http.client import RemoteDisconnected
from fastapi import APIRouter, Request, Depends, HTTPException
from starlette.responses import FileResponse, JSONResponse
from sse_starlette.sse import EventSourceResponse
from youtube_dl.utils import YoutubeDLError

from . import dependencies, schemas, config, queue, db
from .downloaders import DownloaderInterface, get_unique_id

router = APIRouter()


_ansi_escape = re.compile(r"(?:\x1B[@-_]|[\x80-\x9F])[0-?]*[ -/]*[@-~]")

def make_internal_error(error_code: str = "internal-server-error") -> JSONResponse:
    return JSONResponse(
        {"detail": "Remote server encountered problem, please try again...", "code": error_code},
        status_code=500,
    )


async def on_youtube_dl_error(request, exc: YoutubeDLError):
    return JSONResponse({"detail": _ansi_escape.sub("", str(exc)), "code": "downloader-error"}, status_code=500)


async def on_remote_disconnected(request, exc: RemoteDisconnected):
    return make_internal_error("external-service-network-error")


async def on_socket_timeout(request, exc: socket.timeout):
    return make_internal_error("external-service-timeout-error")


async def on_runtimeerror(request, exc: RuntimeError):
    return make_internal_error()


@router.get(
    "/info",
    response_model=schemas.VersionResponse,
    status_code=200,
    responses={500: {"model": schemas.DetailMessage,}},
)
async def info(
    uid: typing.Optional[str] = None,
    settings: config.Settings = Depends(dependencies.get_settings),
    datasource: db.DAOInterface = Depends(dependencies.get_database),
):
    """
    Endpoint for getting info about server API.
    """
    if uid is None:
        uid = get_unique_id()
    return {
        "youtube_dl_version": settings.youtube_dl_version,
        "api_version": settings.version,
        "media_options": [
            media_format.value for media_format in schemas.MediaFormatOptions
        ],
        "uid": uid,
        "downloads": datasource.fetch_downloads(uid),
    }


@router.put(
    "/fetch",
    response_model=schemas.FetchedListResponse,
    status_code=201,
    responses={500: {"model": schemas.DetailMessage,}},
)
async def fetch_media(
    uid: str,
    json_params: schemas.YTDLParams,
    datasource: db.DAOInterface = Depends(dependencies.get_database),
    downloader: DownloaderInterface = Depends(dependencies.get_downloader),
):
    """
    Endpoint for fetching video from Youtube and converting it to
    specified format.
    """
    download = downloader.get_video_info(json_params)
    datasource.put_download(uid, download)
    downloader.submit_download_task(
        uid, download.media_id, json_params,
    )
    return {"downloads": datasource.fetch_downloads(uid)}


@router.get(
    "/fetch",
    responses={
        200: {
            "content": {"application/octet-stream": {}},
            "description": "Downloaded media file",
        },
        404: {
            "content": {"application/json": {}},
            "model": schemas.DetailMessage,
            "description": "Download not found",
            "example": {"detail": "Download not found"},
        },
    },
)
async def download_media(
    uid: str,
    media_id: str,
    datasource: db.DAOInterface = Depends(dependencies.get_database),
    event_queue: queue.NotificationQueue = Depends(dependencies.get_notification_queue),
):
    """
    Endpoint for downloading fetched video from Youtube.
    """
    media_file = datasource.get_download(uid, media_id)
    if not media_file:
        raise HTTPException(status_code=404, detail="Download not found")
    if not media_file._file_path.exists():
        raise HTTPException(status_code=404, detail="Downloaded file not found")
    media_file.status = schemas.ProgressStatusEnum.DOWNLOADED
    datasource.put_download(uid, media_file)
    await event_queue.put(uid, media_file)
    return FileResponse(
        media_file.file_path,
        media_type="application/octet-stream",
        filename=media_file.filename,
    )


@router.get("/fetch/stream")
async def fetch_stream(
    uid: str,
    request: Request,
    event_queue: queue.NotificationQueue = Depends(dependencies.get_notification_queue),
    datasource: db.DAOInterface = Depends(dependencies.get_database),
):
    """
    SSE endpoint for recieving download status of media items.
    """

    async def _stream():
        while True:
            if await request.is_disconnected():
                break
            try:
                data = await event_queue.get(uid)
            except asyncio.QueueEmpty:
                continue
            else:
                datasource.update_download_progress(data)
                yield data.json()

    return EventSourceResponse(_stream())
