import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Button from '@mui/material/Button';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CloseIcon from '@mui/icons-material/Close';
import LinkIcon from '@mui/icons-material/Link';
import Typography from '@mui/material/Typography';
import { IconButton, styled } from '@mui/material';

import { API } from '../api';
import { useContext } from 'react';
import { LoadingContext } from '../context/LoadingContext';


const CustomisedCardActions = styled(CardActions)(() => ({
    justifyContent: "center",
    margin: "0"
}));


const Preview = ({ preview, onSubmitSuccess, setPreview }) => {
    const setIsLoading = useContext(LoadingContext);
    const [audioStream, setAudioStream] = useState(preview.audioStreams[0].id)
    const [videoStream, setVideoStream] = useState(preview.videoStreams[0].id)
    const [mediaFormat, setMediaFormat] = useState(preview.mediaFormats[0])

    const { audioStreams, videoStreams, mediaFormats } = preview;

    const onDownloadClick = async () => {
        const url = preview.url;
        setIsLoading(true);
        API.enqueueDownload(url, videoStream, audioStream, mediaFormat).catch((error) => {
            console.log(error);
        }).then(() => {
            onSubmitSuccess();
            setIsLoading(false);
        });
    }

    const onDiscardClick = async () => {
        setPreview(null);
    }

    const onLinkClick = () => {
        window.open(preview.url);
    };

    return (
        <Card sx={{ maxWidth: 300 }}>
            <CardMedia
                component="img"
                alt="green iguana"
                height="180"
                image={preview.thumbnailUrl}
            />
            <CardContent>
                <Typography gutterBottom variant="p" fontWeight="bold" component="div">
                    {preview.title}
                </Typography>
                <IconButton aria-label="link" onClick={onLinkClick}>
                    <LinkIcon />
                </IconButton>
                <FormControl sx={{ m: 1, width: "100%" }}>
                    <InputLabel id="audio-bitrate-select-label">Audio bitrate</InputLabel>
                    <Select
                        labelId="audio-sbitrate-select-label"
                        id="audio-bitrate-select"
                        value={audioStream}
                        label="Audio bitrate"
                        onChange={(e) => setAudioStream(e.target.value)}
                    >
                        {audioStreams.map((a) =>
                            <MenuItem key={a.id} value={a.id}>{a.bitrate} {a.mimetype}</MenuItem>
                        )}
                    </Select>
                </FormControl>
                <FormControl sx={{ m: 1, width: "100%" }}>
                    <InputLabel id="video-stream-select-label">Video stream</InputLabel>
                    <Select
                        labelId="video-stream-select-label"
                        id="video-stream-select"
                        value={videoStream}
                        label="Video stream"
                        onChange={(e) => setVideoStream(e.target.value)}
                    >
                        {videoStreams.map((v) =>
                            <MenuItem key={v.id} value={v.id}>{v.resolution} {v.mimetype}</MenuItem>
                        )}
                    </Select>
                </FormControl>
                <FormControl sx={{ m: 1, width: "100%" }}>
                    <InputLabel id="media-format-select-label">Media format</InputLabel>
                    <Select
                        labelId="media-format-select-label"
                        id="media-format-select"
                        value={mediaFormat}
                        label="Media format"
                        onChange={(e) => setMediaFormat(e.target.value)}
                    >
                        {mediaFormats.map((m) =>
                            <MenuItem key={m} value={m}>{m}</MenuItem>
                        )}
                    </Select>
                </FormControl>
            </CardContent>
            <CustomisedCardActions>
                <Button variant="contained" color="primary" startIcon={<FileDownloadIcon />} onClick={onDownloadClick}>
                    Download
                </Button>
                <Button variant="outlined" color="error" startIcon={<CloseIcon />} onClick={onDiscardClick}>
                    Discard
                </Button>
            </CustomisedCardActions>
        </Card >
    )
}

Preview.propTypes = {
    preview: PropTypes.shape({
        url: PropTypes.string,
        title: PropTypes.string,
        duration: PropTypes.number,
        thumbnailUrl: PropTypes.string,
        audioStreams: PropTypes.arrayOf(PropTypes.shape({
            id: PropTypes.string.isRequired,
            mimetype: PropTypes.string.isRequired,
            bitrate: PropTypes.string.isRequired
        })),
        videoStreams: PropTypes.arrayOf(PropTypes.shape({
            id: PropTypes.string.isRequired,
            mimetype: PropTypes.string.isRequired,
            resolution: PropTypes.string.isRequired
        })),
        mediaFormats: PropTypes.arrayOf(PropTypes.string)
    }),
    onSubmitSuccess: PropTypes.func,
    setPreview: PropTypes.func
}

export default Preview;
