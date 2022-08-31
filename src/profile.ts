
import { AppContext } from "./appcontext";
import { Channel } from "./Channel";
import { Dispatcher } from "./Dispatcher";
import { ProfileHandler } from "./profilehandler";

export class Profile implements ProfileHandler {
    private appContext: AppContext;

    /**
     * Get the total number of subscribed channels from local store
     * @returns The number of subscribed channels
     */
    public getNumberOfSubscriptions(): number {
        throw new Error("Method not implemented.");
    }

    public getOwnedChannelCount(): number {
        throw new Error("Method not implemented.");
    }

    public getOwnedChannels(): Channel[] {
        throw new Error("Method not implemented.");
    }

    public queryOwnedChannelCount(): Promise<number> {
        throw new Error("Method not implemented.");
    }

    public queryOwnedChannels(): Promise<Channel[]> {
        throw new Error("Method not implemented.");
    }

    public async queryAndDispatchOwnedChannels(dispatcher: Dispatcher<Channel>) {
        throw new Error("Method not implemented.");
    }

    public queryOwnedChannnelById(channelId: string): Promise<Channel> {
        throw new Error("Method not implemented.");
    }

    public async queryAndDispatchOwnedChannelById(dispatcher: Dispatcher<Channel>) {
        throw new Error("Method not implemented.");
    }

    public querySubscriptionCount(): Promise<number> {
        throw new Error("Method not implemented.");
    }

    public querySubscriptions(earlierThan: number, upperLimit: number): Promise<Channel[]> {
        throw new Error("Method not implemented.");
    }

    public async queryAndDispatchSubscriptions(earlierThan: number,
        upperLimit: number,
        dispatcher: Dispatcher<Channel>) {
        throw new Error("Method not implemented.");
    }
}
