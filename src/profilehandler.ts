import { ChannelInfo } from "./ChannelInfo";
import { Dispatcher } from "./Dispatcher";

export interface ProfileHandler {
    /**
     * Query the total number of owned channels.
     * @returns A promise object that contains the number of owned channels.
     */
    queryOwnedChannelCount(): Promise<number>;

    /**
     * Query a list of owned channel.
     * @returns A promise object that contains a list of channel.
     */
    queryOwnedChannels(): Promise<ChannelInfo[]>;

    /**
     * Query a list of owned channels and send it to dispatcher routine one by one.
     *
     * @param dispatcher The disptach routine to handle a channel.
     */
    queryAndDispatchOwnedChannels(dispatcher: Dispatcher<ChannelInfo>);

    /**
     * Query specific owned channel by channel identifier
     * @param channelId
     * @returns A promise object that contains Channel
     */
    queryOwnedChannnelById(channelId: string): Promise<ChannelInfo>;

    /**
     * Query specific owned channel by channelid and send it to dispatcher routine.
     * @param dispatcher The dispatcher routine to handle the channel
     */
    queryAndDispatchOwnedChannelById(channelId: string, dispatcher: Dispatcher<ChannelInfo>);

    /**
     * Query the total acount of subscribed channels.
     * @returns A promise object that contain the total number of subscribed channels.
     */
     querySubscriptionCount(): Promise<number>;

     /**
      * Query a list of subscribed channels.
      * @param earlierThan
      * @param maximum
      * @param upperLimit
      */
     querySubscriptions(earlierThan: number, maximum: number): Promise<ChannelInfo[]>;

     /**
      * Query a list of subscribed channesl and sent it to dispatcher routine to handle.
      *
      * @param earlierThan
      * @param maximum
      * @param dispatcher
      */
     queryAndDispatchSubscriptions(earlierThan: number, maximum: number, dispatcher: Dispatcher<ChannelInfo>);
}
