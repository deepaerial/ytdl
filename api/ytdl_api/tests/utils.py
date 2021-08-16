from typing import List, Union, Type
from pydantic import parse_obj_as
from random import choice
from ytdl_api.schemas import BaseStream, AudioStream, VideoStream


def get_random_stream_id(
    video_or_audio_streams: List[Union[dict, BaseStream]],
    expected_type: Type[Union[VideoStream, AudioStream]],
) -> str:
    if isinstance(video_or_audio_streams[0], dict):
        video_or_audio_streams = parse_obj_as(
            List[expected_type], video_or_audio_streams
        )
    stream = choice(video_or_audio_streams)
    return stream.id
