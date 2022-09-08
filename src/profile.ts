import { AppContext } from "./appcontext";
import { Channel } from "./Channel";
import { ChannelInfo } from "./ChannelInfo";
import { Dispatcher } from "./Dispatcher";
import { ProfileHandler } from "./profilehandler";
import { hiveService as VaultService } from "./hiveService"
import { CollectionNames as collections, ScriptingNames as scripts } from "./vault/constants"
import { Logger } from './utils/logger'

const logger = new Logger("Profile")

export class Profile implements ProfileHandler {
    private appContext: AppContext;
    private readonly targetDid: string;
    private vault: VaultService

    public async getOwnedChannelCount(): Promise<number> {
        return new Promise<number>(async (resolve, _reject) => {
            const filter = {
            }
            const result = await this.vault.callScript(collections.BACKUP_SUBSCRIBEDCHANNELS, filter,
                this.targetDid, this.appContext.getAppDid())
            const channels = result.find_message.items
            resolve(channels.length)
        }).catch(error => {
            logger.error('get owned channels count error: ', error)
            throw new Error(error)
        })
    }

    //创建的channel
    public async getOwnedChannels(): Promise<Channel[]> {
        return new Promise<Channel[]>(async (resolve, _reject) => {
            const filter = {
            }
            const result = await this.vault.callScript(collections.BACKUP_SUBSCRIBEDCHANNELS, filter,
                this.targetDid, this.appContext.getAppDid())
            const data = result.find_message.items
            return data
        }).then(result => {
            let channels = []
            result.forEach(item => {
                const channel = Channel.parseOne(this.targetDid, item)
                channels.push(channel)
            })
            return channels
        }).catch(error => {
            logger.error('get owned channels error: ', error)
            throw new Error(error)
        })
    }

    public queryOwnedChannelCount(): Promise<number> {
        throw new Error("Method not implemented.");
    }

    public queryOwnedChannels(): Promise<ChannelInfo[]> {
        throw new Error("Method not implemented.");
    }

    public async queryAndDispatchOwnedChannels(dispatcher: Dispatcher<ChannelInfo>) {
        return this.queryOwnedChannels().then (channels => {
            channels.forEach(item => {
                dispatcher.dispatch(item)
            })
        }).catch (error => {
            throw new Error(error)
        })
    }

    public async queryOwnedChannnelById(channelId: string): Promise<ChannelInfo> {
        throw new Error("Method not implemented.");
    }

    public async queryAndDispatchOwnedChannelById(channelId: string, dispatcher: Dispatcher<ChannelInfo>) {
        return this.queryOwnedChannnelById(channelId).then (channel => {
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

    public async querySubscriptionCount(): Promise<number> {
        throw new Error("Method not implemented.");
    }

    public async querySubscriptions(earlierThan: number, upperLimit: number): Promise<ChannelInfo[]> {
        throw new Error("Method not implemented.");
    }

    public async queryAndDispatchSubscriptions(earlierThan: number, upperLimit: number,
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
