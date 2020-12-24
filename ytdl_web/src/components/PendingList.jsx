import React, { Component } from 'react';
import DownloadsContext from '../context/DownloadsContext';
import styled from 'styled-components';

import MediaItem from './MediaItem.jsx';

const ListContainer = styled.div`
    max-width: ${props => props.isDesktop ? 60 : 90}%;
    margin-top: 15px;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-content: space-around;
    justify-content: ${props => props.isDesktop ? "space-around" : "center"};
`;
export default class PendingList extends Component {

    static contextType = DownloadsContext;

    render() {
        let { downloads } = this.context;
        const { isDesktop } = this.props;
        // const exampleValue = {
        //     "title": "Adam Knight - I've Got The Gold (Shoby Remix)",
        //     "duration": 479000,
        //     "filesize": 5696217,
        //     "video_url": "https://www.youtube.com/watch?v=B8WgNGN0IVA",
        //     "thumbnail": {
        //         "url": "https://i.ytimg.com/vi_webp/B8WgNGN0IVA/maxresdefault.webp",
        //         "width": 1920,
        //         "height": 1080
        //     },
        //     "progress": 80,
        //     "status": "downloading"
        // }
        downloads = Object.entries(downloads).map(([k, v]) => v);
        return (
            <ListContainer isDesktop={isDesktop}>
                {downloads.map((download, index) => <MediaItem key={index} downloadItem={download} />)}
                {/* <MediaItem key={0} downloadItem={exampleValue} isDesktop={isDesktop}/> */}
            </ListContainer>
        )
    }
}
