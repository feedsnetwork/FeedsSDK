import { Channel } from "./Channel"
import { ChannelEntry } from "./ChannelEntry"
import { ProfileHandler } from "./profilehandler"
import { ChannelInfo } from "./ChannelInfo"
import { Dispatcher } from "./Dispatcher"
import { MyChannel } from "./MyChannel"
import { hiveService as VaultService } from "./hiveService"
import { config } from "./config"
import { Logger } from './utils/logger'
import { UpdateOptions } from "@elastosfoundation/hive-js-sdk"
import { AppContext } from "./appcontext"

const logger = new Logger("Channel")

type SubscribedChannel = {
    targetDid: string,// 订阅channel的创建者的did
    channelId: string
}

export class MyProfile implements ProfileHandler {
    private appContext: AppContext;

    private readonly userDid: string;

    private vault: VaultService

    /**
     * Query the total number of channels created by this profile.
     *
     * @returns A promise object that contains the number of owned channels.
     */
    public async queryOwnedChannelCount(): Promise<number> {
        return new Promise( async() => {
            await this.vault.queryDBData(config.TABLE_CHANNELS, {});
        }).then (result => {
            return MyChannel.parse(this.userDid, result).length
        }).catch (error => {
            logger.error('fetch own channel count error: ', error)
            throw new Error(error)
        });
    }

     /**
      * Query a list of all channels (less than 5 channels) created by this profile.
      *
      * @returns A promise object that contains an array of channels.
      */
    public async queryOwnedChannels(): Promise<ChannelInfo[]> {
        return new Promise( async() => {
            await this.vault.queryDBData(config.TABLE_CHANNELS, {})
        }).then (result => {
            return MyChannel.parse(this.userDid, result);
        }).catch (error => {
            logger.error('query owned channel error: ', error)
            throw new Error(error)
        })
    }

    /**
     * Query a list of channels created by this profile and dispatch them to a customized
     * routine to handle one by one.
     *
     * @param dispatcher The disptach routine to handle a channel.
     */
    public async queryAndDispatchOwnedChannels(dispatcher: Dispatcher<ChannelInfo>) {
        return this.queryOwnedChannels().then (channels => {
            channels.forEach( channel => {
                dispatcher.dispatch(channel)
            })
        }).catch ( error => {
            logger.error('query owned channel error: ', error)
            throw new Error(error)
        })
    }

    /**
     * Query a specific channel by channelid created by this profile.
     *
     * @param channelId The channelId of channel to query
     * @returns A promise object that contains the channel information.
     */
    public async queryOwnedChannnelById(channelId: string): Promise<ChannelInfo> {
        return new Promise( async() => {
            const filter = { "channel_id": channelId }
            await this.vault.queryDBData(config.TABLE_CHANNELS, filter)
        }).then (result => {
            return MyChannel.parseOne(this.userDid, result)
        }).catch (error => {
            logger.error('fetch own channels error: ', error)
            throw new Error(error);
        })
    }

    /**
     * Query a specific channel owned by this profile by channelid.
     *
     * @param channelId The channelid to query
     * @param dispatcher The disaptch routine to handle channel information
     */
    public async queryAndDispatchOwnedChannelById(channelId: string, dispatcher: Dispatcher<ChannelInfo>) {
        return this.queryOwnedChannnelById(channelId).then (channel => {
            dispatcher.dispatch(channel);
        }).catch (error => {
            logger.error('query owned channel by channelid error: ', error)
            throw new Error(error);
        })
    }

    /**
     * Query the total number of channels subscribed by this profile.
     *
     * @returns A promise object that contains the number of subscribed channels.
     */
    public async querySubscriptionCount(): Promise<number> {
        return new Promise( async() => {
            await this.vault.queryDBData(config.TABLE_BACKUP_SUBSCRIBEDCHANNEL, {})
        }).then (result => {
            // return this.parseBackupSubscribedChannel(result).length
            return 0
        }).catch (error => {
            logger.error('fetch subscription count error: ', error)
            throw new Error(error)
        })
    }

    parseBackupSubscribedChannel(result: any): SubscribedChannel[] {
        const subscribedChannels = result
        let parseResult: SubscribedChannel[] = []
        if (!subscribedChannels || subscribedChannels.length == 0) {
            return []
        }
        subscribedChannels.forEach(item => {
            const subscribed: SubscribedChannel = {
                targetDid: item.target_did,
                channelId: item.channel_id,
            }
            parseResult.push(subscribed)
        })
        return parseResult
    }

    /**
      * Query a list of channels subscribed by this profile.
      *
      * @param earlierThan
      * @param maximum
      * @param upperLimit
      */
    public async querySubscriptions(earlierThan: number, maximum: number): Promise<ChannelInfo[]> {
        return new Promise(async () => {
            const filter = {
                "limit" : { "$lt": maximum },
                "created": { "$gt": earlierThan }
            }
            const result = this.vault.queryDBData(config.TABLE_BACKUP_SUBSCRIBEDCHANNEL, filter)
            // const parseResult = this.parseBackupSubscribedChannel(result)
        }).then (result => {
            /*
            parseResult.forEach(async item => {
                const params = {
                    "channel_id": item.channelId,
                }
                const appid = config.ApplicationDID
                const scriptName = config.SCRIPT_QUERY_SUBSCRIPTION_BY_CHANNELID
                logger.log('Call script, targetDid:', item.targetDid, 'scriptName:', scriptName, 'params:', params)
                let detailResult = await this.vault.callScript(scriptName, params, item.targetDid, appid, this.userDid)
                logger.log('Call script success, result is', detailResult)
                return Channel.parse(item.targetDid, detailResult.find_message.items)
            })
             */
            return null
        }).catch (error => {
            logger.error('fetch subscription count error: ', error)
            throw new Error(error);
        })
    }

    /**
      * Query a list of channels subscribed by this profile and dispatch them to customized routine
      * to handle.
      *
      * @param earlierThan
      * @param maximum
      * @param upperLimit
      */
    public async queryAndDispatchSubscriptions(earlierThan: number, maximum: number,
        dispatcher: Dispatcher<ChannelInfo>) {

        return this.querySubscriptions(earlierThan, maximum).then(channels => {
            channels.forEach((channel) => {
                dispatcher.dispatch(channel);
            })
        })
    }

    /**
     * Create a channel on remote vault
     *
     * @param name channel name
     * @param intro brief introduction to the channel
     * @param receivingAddr the ESC address to receive tipping payment
     * @param category channel category
     * @param proof [option] sigature to the channel metadata
     */
    public async createChannel(channelInfo: ChannelInfo) {
        return new Promise(async () => {
            const doc = {
                "channel_id": channelInfo.getChannelId(),
                "name"      : channelInfo.getName(),
                "display_name"  : channelInfo.getDisplayName(),
                "intro"     : channelInfo.getDescription(),
                "avatar"    : channelInfo.getAvatar(),
                "created_at": channelInfo.getCreatedAt(),
                "updated_at": channelInfo.getUpdatedAt(),
                "type"      : channelInfo.getType(),
                "tipping_address": channelInfo.getReceivingAddress(),
                "nft"       : channelInfo.getNft(),
                "memo"      : channelInfo.getMmemo(),
                "category"  : channelInfo.getCategory(),
                "proof"     : channelInfo.getProof()
            }

            await this.vault.insertDBData(config.TABLE_CHANNELS, doc)
        }).then( result => {
            // TODO:
            const channelInfos = MyChannel.parse(this.userDid, [result])
            return channelInfos[0]
        }).catch (error => {
            logger.error("Create channel error: ", error)
            throw new Error(error)
        })
    }

    /**
     * Freeze channel when owner stop maintainning the channel.
     * Notice: calling this method will not remove channel metadata on remote vault
     * and also would keep all channel subscribers and all post data there. After calling
     * this method, channel owner would be unable to make posts on this channel, and
     * subscribers are also allowed to fetch posts but can not make comments on the posts.
     * This is the solf way to stop maintaining channel.
     *
     * @param _channelId the channel to be freezed
     * @returns
     */

    public async freezeChannel(_channelId: string) {
        throw new Error("Method not implemented");
    }

    /**
     * TODO:
     *
     * @param _channelId
     * @returns
     */
    public async unfreezeChannel(_channelId: string) {
        throw new Error("Method not implemented");
    }

    /**
     * Hard way to stop maintaining channel.
     * Warning: calling this method would lead to irreversible consequence that all Posts
     * on this channel and all subscribers would be removed and lost permanently.
     *
     * And users should unpublish (unregister) this channel from registery contract
     * on blockchain before decide to delete this channel.
     *
     * @param channelId channel id of the channel to be deleted.
     * @returns
     */
    public async deleteChannel(channelId: string) {
        return new Promise( async() => {
            const doc = {
                "updated_at": new Date().getTime(),
                "status": 1,
            }
            const filter = { "channel_id": channelId }
            const update = { "$set": doc}

            return this.vault.updateOneDBData(config.TABLE_CHANNELS, filter, update,
                new UpdateOptions(false, true))
        }).then (() => {
            // TODO: reserved
        }).catch (error => {
            logger.error("Delete channel error: ", error)
            throw new Error(error)
        })
    }

    /**
     * purge channel
     *
     * @param myChannel
     * @returns
     */
    public async purgeChannel(_channelId: string) {
        throw new Error("Method not implemented");
    }

    /**
     * Publish channel onto Feeds channel registry contract, which is an ERC721 compatbile
     * contract as Feeds channel collection.
     *
     * @param channelId the channel Identifier to be published on registry contract.
     * @returns
     */
    public async publishChannel(_myChannel: MyChannel) {
        throw new Error("Method not implemented");
    }

    /**
     *
     * @param _channelId
     * @returns
     */
    public async unpublishChannel(_channelId: string) {
        throw new Error("Method not implemented");
    }

    /**
     * TODO:
     *
     * @param channel
     * @returns
     */
    public async subscribeChannel(channelEntry: ChannelEntry) {
        return new Promise( async() => {
            const params = {
                "channel_id": channelEntry.getChannelId(),
                "created_at": channelEntry.getCreatedAt(),
                "display_name": channelEntry.getDisplayName(),
                "updated_at": channelEntry.getUpdatedAt(),
                "status"    : channelEntry.getStatus()
            }

            await this.vault.callScript(config.SCRIPT_SUBSCRIBE_CHANNEL, params,
                channelEntry.getTargetDid(), this.appContext.getAppDid())
        }).then (result => {
            return Channel.parseChannel(result)
        }).catch (error => {
            logger.error('Subscribe channel error:', error)
            throw new Error(error)
        })
}

    /**
     * TODO:
     *
     * @param channel
     * @returns
     */
    public async unsubscribeChannel(channelEntry: ChannelEntry) {
        return new Promise( async() => {
            const params = {
                "channel_id": channelEntry.getChannelId(),
                "updated_at": channelEntry.getUpdatedAt(),
                "status": channelEntry.getStatus()
            }
            return this.vault.callScript(config.SCRIPT_UPDATE_SUBSCRIPTION, params,
                    channelEntry.getTargetDid(), this.appContext.getAppDid())
        }).then (result => {
            // TODO
        }).catch (error => {
            logger.error("Unsbuscribe channel error:", error)
            throw new Error(error)
        })
   }
}
