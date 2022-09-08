import { Channel } from "./Channel"
import { ChannelEntry } from "./ChannelEntry"
import { ProfileHandler } from "./profilehandler"
import { ChannelInfo } from "./ChannelInfo"
import { Dispatcher } from "./Dispatcher"
import { MyChannel } from "./MyChannel"

import { hiveService as VaultService } from "./hiveService"
import { Logger } from './utils/logger'
import { UpdateOptions } from "@elastosfoundation/hive-js-sdk"
import { AppContext } from "./appcontext"
import { CollectionNames as collections, ScriptingNames as scripts } from "./vault/constants"

const logger = new Logger("Channel")

/*
type SubscribedChannel = {
    targetDid: string,// 订阅channel的创建者的did
    channelId: string
} */

export class MyProfile {
    private appContext: AppContext;

    private readonly userDid: string;

    private vault: VaultService

    /**
     * Query the total number of channels created by this profile.
     *
     * @returns A promise object that contains the number of owned channels.
     */
    public queryOwnedChannelCount(): Promise<number> {
        return new Promise( (resolve, _reject) => {
            const result = this.vault.queryDBData(collections.CHANNELS, {})
            // TODO: error.
            resolve(result)
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
    public queryOwnedChannels(): Promise<ChannelInfo[]> {
        return new Promise( (resolve, _reject) => {
            const result = this.vault.queryDBData(collections.CHANNELS, {})
            // TODO: error
            resolve(result)
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
    public queryAndDispatchOwnedChannels(dispatcher: Dispatcher<ChannelInfo>) {
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
    public queryOwnedChannnelById(channelId: string): Promise<ChannelInfo> {
        return new Promise((resolve, _reject) => {
            const filter = { "channel_id": channelId }
            const result = this.vault.queryDBData(collections.CHANNELS, filter)
            // TODO: error.
            resolve(result)
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
    public queryAndDispatchOwnedChannelById(channelId: string, dispatcher: Dispatcher<ChannelInfo>) {
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
    public querySubscriptionCount(): Promise<number> {
        return new Promise( (resolve, _reject) => {
            const result = this.vault.queryDBData(collections.BACKUP_SUBSCRIBEDCHANNELS, {})
            // TODO:
            resolve(result)
        }).then (_result => {
            // return this.parseBackupSubscribedChannel(result).length
            return 0
        }).catch (error => {
            logger.error('fetch subscription count error: ', error)
            throw new Error(error)
        })
    }
/*
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
    }*/

    /**
      * Query a list of channels subscribed by this profile.
      *
      * @param earlierThan
      * @param maximum
      * @param upperLimit
      */
    public querySubscriptions(earlierThan: number, maximum: number): Promise<ChannelInfo[]> {
        return new Promise<any>( (resolve, _reject) => {
            const filter = {
                "limit" : { "$lt": maximum },
                "created": { "$gt": earlierThan }
            }
            const result = this.vault.queryDBData(collections.BACKUP_SUBSCRIBEDCHANNELS, filter)
            // const parseResult = this.parseBackupSubscribedChannel(result)
            // TODO: error.
            resolve(result)
        }).then ((result: ChannelInfo[]) => {
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
            return result
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
    public queryAndDispatchSubscriptions(earlierThan: number, maximum: number,
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
    public createChannel(channelInfo: ChannelInfo) {
        return new Promise((resolve, _reject) => {
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

            const result = this.vault.insertDBData(collections.CHANNELS, doc)
            // TODO:
            resolve(result)
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

    public freezeChannel(_channelId: string): Promise<void> {
        throw new Error("Method not implemented");
    }

    /**
     * TODO:
     *
     * @param _channelId
     * @returns
     */
    public unfreezeChannel(_channelId: string): Promise<void> {
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
    public deleteChannel(channelId: string) {
        return new Promise( (resolve, _reject) => {
            const doc = {
                "updated_at": new Date().getTime(),
                "status": 1,
            }
            const filter = { "channel_id": channelId }
            const update = { "$set": doc}

            const result = this.vault.updateOneDBData(collections.CHANNELS, filter, update,
                new UpdateOptions(false, true))
            // TODO: error.
            resolve(result)
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
    public purgeChannel(_channelId: string): Promise<void> {
        throw new Error("Method not implemented");
    }

    /**
     * Publish channel onto Feeds channel registry contract, which is an ERC721 compatbile
     * contract as Feeds channel collection.
     *
     * @param channelId the channel Identifier to be published on registry contract.
     * @returns
     */
    public publishChannel(_myChannel: MyChannel): Promise<void> {
        throw new Error("Method not implemented");
    }

    /**
     *
     * @param _channelId
     * @returns
     */
    public unpublishChannel(_channelId: string): Promise<void> {
        throw new Error("Method not implemented");
    }

    /**
     * TODO:
     *
     * @param channel
     * @returns
     */
    public subscribeChannel(channelEntry: ChannelEntry) {
        return new Promise( (resolve, _reject) => {
            const params = {
                "channel_id": channelEntry.getChannelId(),
                "created_at": channelEntry.getCreatedAt(),
                "display_name": channelEntry.getDisplayName(),
                "updated_at": channelEntry.getUpdatedAt(),
                "status"    : channelEntry.getStatus()
            }

            const result = this.vault.callScript(scripts.SCRIPT_SUBSCRIBE_CHANNEL, params,
                channelEntry.getTargetDid(), this.appContext.getAppDid())

            // TODO: error.
            resolve(result)
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
    public unsubscribeChannel(channelEntry: ChannelEntry): Promise<void> {
        return new Promise((resolve, _reject) => {
            const params = {
                "channel_id": channelEntry.getChannelId(),
                "updated_at": channelEntry.getUpdatedAt(),
                "status": channelEntry.getStatus()
            }
            const result = this.vault.callScript(scripts.SCRIPT_UPDATE_SUBSCRIPTION, params,
                    channelEntry.getTargetDid(), this.appContext.getAppDid())
            // TODO: error
            resolve(result)
        }).then (_result => {
            // TODO
        }).catch (error => {
            logger.error("Unsbuscribe channel error:", error)
            throw new Error(error)
        })
   }
}
