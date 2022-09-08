
import { AppContext } from "./appcontext";
import { Channel } from "./Channel";
import { ChannelInfo } from "./ChannelInfo";
import { Dispatcher } from "./Dispatcher";

export class MyProfile {
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

    public queryOwnedChannels(): Promise<ChannelInfo[]> {
        throw new Error("Method not implemented.");
    }

    public queryAndDispatchOwnedChannels(dispatcher: Dispatcher<ChannelInfo>) {
        return this.queryOwnedChannels().then (channels => {
            channels.forEach(item => {
                dispatcher.dispatch(item)
            })
        }).catch (error => {
            throw new Error(error)
        })
    }

    public queryOwnedChannnelById(channelId: string): Promise<ChannelInfo> {
        throw new Error("Method not implemented.");
    }

    public queryAndDispatchOwnedChannelById(channelId: string, dispatcher: Dispatcher<ChannelInfo>) {
        return this.queryOwnedChannnelById(channelId).then (channel => {
            dispatcher.dispatch(channel)
        }).catch (error => {
            throw new Error(error)
        })
    }

    public getSubscriptionCount(): number {
        throw new Error("Method not implemented.");
    }

    public querySubscriptionCount(): Promise<number> {
        throw new Error("Method not implemented.");
    }

    public querySubscriptions(earlierThan: number, upperLimit: number): Promise<ChannelInfo[]> {
        throw new Error("Method not implemented.");
    }

    public queryAndDispatchSubscriptions(earlierThan: number, upperLimit: number,
        dispatcher: Dispatcher<ChannelInfo>) {

        return this.querySubscriptions(earlierThan, upperLimit).then (channels => {
            channels.forEach(item => {
                dispatcher.dispatch(item)
            })
        }).catch (error => {
            throw new Error(error)
        })
    }
}
