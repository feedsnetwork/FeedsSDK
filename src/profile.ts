
import { Channel } from "./Channel";
import { Dispatcher } from "./Dispatcher";
import { ChannelFetcher } from "./ChannelFetcher";

export class Profile implements ChannelFetcher {

    /**
     * Get the total number of subscribed channels from local store
     * @returns The number of subscribed channels
     */
    public getNumberOfSubscriptions(): number {
        throw new Error("Method not implemented.");
    }

    /**
     * Iterate the subscribed channels from local store.
     *
     * @param dispatcher the disaptcher routine
     */
    public iterateSubscriptions(dispatcher: Dispatcher<Channel>) {
        throw new Error("Method not implemented.");
    }


    public getNumberOfOwnChannels(): number {
        throw new Error("Method not implemented.");
    }

    public getOwnChannels(): Promise<Channel[]> {
        throw new Error("Method not implemented.");
    }

    public fetchOwnChannelCount(): Promise<number> {
        throw new Error("Method not implemented.");
    }

    public fetchOwnChannels(): Promise<Channel[]> {
        throw new Error("Method not implemented.");
    }

    public fetchAndDispatchOwnChannels(dispatcher: Dispatcher<Channel>) {
        throw new Error("Method not implemented.");
    }

    public fetchOwnChannnelById(channelId: string): Promise<Channel> {
        throw new Error("Method not implemented.");
    }

    public fetchAndDispatchOwnChannelById(dispatcher: Dispatcher<Channel>) {
        throw new Error("Method not implemented.");
    }

    public fetchSubscriptionCount(): Promise<number> {
        throw new Error("Method not implemented.");
    }

    public fetchSubscriptions(earlierThan: number, upperLimit: number): Promise<Channel[]> {
        throw new Error("Method not implemented.");
    }

    public fetchAndDispatchSubscriptions(earlierThan: number, upperLimit: number, dispatcher: Dispatcher<Channel>) {
        throw new Error("Method not implemented.");
    }
}
