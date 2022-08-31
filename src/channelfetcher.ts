import { Channel } from "./Channel";
import { Dispatcher } from "./Dispatcher";

export interface ChannelFetcher {
    /**
     * Fetch the total count of own channels on remote vault.
     */
    fetchOwnChannelCount(): Promise<number>;

    /**
     * Fetch a list of own channel.
     * @returns A promise object that contains a list of channel.
     */
    fetchOwnChannels(): Promise<Channel[]>;

    /**
     * Fetch a list of own channels and send it to dispatcher routine one by one.
     *
     * @param dispatcher A disptach routine to handle a channel.
     */
    fetchAndDispatchOwnChannels(dispatcher: Dispatcher<Channel>);

    /**
     *
     * @param channelId
     */
    fetchOwnChannnelById(channelId: string): Promise<Channel>;

    /**
     *
     * @param dispatcher
     */
    fetchAndDispatchOwnChannelById(dispatcher: Dispatcher<Channel>);


    /**
     * Fetch the total acount of subscribed channels.
     * @returns The promise object that contain the total number of subscribed channels.
     */
     fetchSubscriptionCount(): Promise<number>;

     /**
      * Fetch a list of subscribed channels.
      * @param earlierThan
      * @param maximum
      * @param upperLimit
      */
     fetchSubscriptions(earlierThan: number, maximum: number): Promise<Channel[]>;

     /**
      * Fetch a list of subscribed channesl and sent it to dispatcher routine to handle.
      *
      * @param earlierThan
      * @param maximum
      * @param dispatcher
      */
     fetchAndDispatchSubscriptions(earlierThan: number, maximum: number, dispatcher: Dispatcher<Channel>);
}
