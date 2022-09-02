
import { AppContext } from "./appcontext";
import { Channel } from "./Channel";
import { Dispatcher } from "./Dispatcher";
import { ProfileHandler } from "./profilehandler";

export class Profile implements ProfileHandler {
    private appContext: AppContext;

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
        return new Promise<Channel[]>( async() => {
            await this.queryOwnedChannels()
        }).then (channels => {
            channels.forEach(item => {
                dispatcher.dispatch(item)
            })
        }).catch (error => {
            throw new Error(error)
        })
    }

    public queryOwnedChannnelById(channelId: string): Promise<Channel> {
        throw new Error("Method not implemented.");
    }

    public async queryAndDispatchOwnedChannelById(channelId: string, dispatcher: Dispatcher<Channel>) {
        return new Promise<Channel>( async() => {
            await this.queryOwnedChannnelById(channelId)
        }).then (channel => {
            dispatcher.dispatch(channel)
        }).catch (error => {
            throw new Error(error)
        })
    }

    /**
     * Get the total number of subscribed channels from local storage
     * @returns The number of subscribed channels
     */
    public getSubscriptionCount(): number {
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

        return new Promise<Channel[]>( async() => {
            await this.querySubscriptions(earlierThan, upperLimit)
        }).then (channels => {
            channels.forEach(item => {
                dispatcher.dispatch(item)
            })
        }).catch (error => {
            throw new Error(error)
        })
    }
}
