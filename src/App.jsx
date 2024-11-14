import React, { useContext, useEffect, useReducer, useState } from 'react';

import { Grid, Stack } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import { Slide } from 'react-toastify';

import Header from './components/Header.jsx'
import SearchBar from './components/SearchBar.jsx';

import { toast } from 'react-toastify';
import { apiURL, API } from './api.js';
import { parametrizeUrl } from './utils.js';
import { LoadingContext } from './context/LoadingContext.jsx';
import { downloadsReducer } from './reducers.js'
import Preview from "./components/Preview.jsx"
import 'react-toastify/dist/ReactToastify.css';
import MediaItem from './components/MediaItem.jsx';
import { ACTION, Statuses } from './constants.js';

import { ConfirmProvider } from "material-ui-confirm";



const App = () => {
    const checkIsDesktop = () => {
        const viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        return viewportWidth > 1024;
    };
    const appVersion = __APP_VERSION__; // eslint-disable-line no-undef

    const [isDesktop, setIsDesktop] = useState(checkIsDesktop());
    const [apiVersion, setVersion] = useState("");
    const setIsLoading = useContext(LoadingContext);
    const [downloads, dispatch] = useReducer(downloadsReducer, {});
    const [preview, setPreview] = useState();

    const onProgressUpdate = (download) => {
        const { mediaId, status, progress, title, filesizeHr } = download;
        dispatch({
            type: ACTION.STATUS_UPDATE,
            mediaId,
            status,
            progress,
            filesizeHr
        });
        if (status === Statuses.FAILED) {
            toast.error(`${title} failed to download.`)
        }
    };

    const downloadList = async () => {
        setIsLoading(true);
        try {
            const downloads = await API.getDownloads();
            setPreview(null);
            dispatch({
                type: ACTION.FETCH_ALL,
                downloads
            });
        } catch (error){
            toast.error(error.message)
        } finally {
            setIsLoading(false);
        }
    };

    const onDownloadDelete = (download) => {
        const { mediaId, status, isAudio, title } = download;
        dispatch({
            type: ACTION.DELETE,
            mediaId,
            status
        });
        toast.success(`${isAudio ? "Audio" : "Video"} file "${title}" was successfully deleted.`)
    };

    useEffect(() => {
        const onAppStart = async () => {
            window.addEventListener('resize', () => setIsDesktop(checkIsDesktop()));
            try {
                const { apiVersion } = await API.getApiVersion();
                console.debug(`API version: ${apiVersion}`);
                setVersion(apiVersion);
                const eventSource = new EventSource(parametrizeUrl(`${apiURL}/download/stream`), { withCredentials: true });
                eventSource.addEventListener("message", (event) => {
                    onProgressUpdate(JSON.parse(event.data));
                });
                eventSource.addEventListener("end", (_) => {  // eslint-disable-line no-unused-vars
                    eventSource.close();
                });
            } catch (error){
                console.error("Could not fetch API version :(")
            }
            finally {
                setIsLoading(false);
            }
        };
        onAppStart();
    }, []);
    useEffect(() => {
        downloadList();
    }, [apiVersion]);

    const renderDownloads = () => {
        if (isDesktop) {
            return (<Grid container spacing={1} justifyContent="center" columns={11} margin={0}>
                {downloads && Object.entries(downloads).map(entry => {
                    const [key, download] = entry;
                    return <Grid item xs={3} key={key}>
                        <MediaItem downloadItem={download} onDeleteAction={onDownloadDelete} />
                    </Grid>
                })}
            </Grid>);
        }
        return (<Stack direction="column" justifyContent="center" alignItems="flex-start" spacing={2} margin={0}>
            {downloads && Object.entries(downloads).map(entry => {
                const [key, download] = entry;
                return (<MediaItem key={key} downloadItem={download} onDeleteAction={onDownloadDelete} />);
            })
            }
        </Stack >);
    };
    return (
        <React.Fragment>
            <ConfirmProvider>
                <ToastContainer
                    position={isDesktop ? "top-right" : "top-center"}
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop={true}
                    transition={Slide}
                    draggable
                    pauseOnHover
                />
                <Header version={appVersion} apiVersion={apiVersion}/>
                <SearchBar isDesktop={isDesktop} setPreview={setPreview} />
                {preview && <Preview preview={preview} onSubmitSuccess={downloadList} setPreview={setPreview} />}
                {renderDownloads()}
            </ConfirmProvider>
        </React.Fragment>
    );
}

export default App;
