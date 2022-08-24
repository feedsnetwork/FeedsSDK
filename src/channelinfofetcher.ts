import { ChannelInfo } from "./ChannelInfo";
import { Dispatcher } from "./Dispatcher";

export interface ChannelInfoFetcher {
    /**
     * Fetch channel property information from remote chanenl.
     * @returns The promise object containing the channel information
     */
    fetchChannelInfo(): Promise<ChannelInfo>;

    /**
     * Fetch channel property information and send it to dispatcher routine.
     *
     * @param dispatcher the dispatch routine to deal with channel infomration;
     */
    fetchAndDispatchChannelInfo(dispatcher: Dispatcher<ChannelInfo>);
}
