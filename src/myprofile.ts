import { Channel } from "./Channel"
import { ChannelEntry } from "./ChannelEntry"
import { ProfileHandler } from "./profilehandler"
import { ChannelInfo } from "./ChannelInfo"
import { Dispatcher } from "./Dispatcher"
import { MyChannel } from "./MyChannel"
import { hiveService } from "./hiveService"
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
    private readonly appDid: string;
    private readonly appInstanceDid: string;

    private hiveservice: hiveService
    private resolveCache: string;

    /**
     * Query the total number of channels created by this profile.
     *
     * @returns A promise object that contains the number of owned channels.
     */
    public async queryOwnedChannelCount(): Promise<number> {
        return new Promise( async() => {
            await this.hiveservice.queryDBData(config.TABLE_CHANNELS, {});
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
    public queryOwnedChannels(): Promise<Channel[]> {
        return new Promise( async() => {
            await this.hiveservice.queryDBData(config.TABLE_CHANNELS, {})
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
    public async queryAndDispatchOwnedChannels(dispatcher: Dispatcher<Channel>) {
        return new Promise<Channel[]>( async() => {
            await this.queryOwnedChannels()
        }).then (channels => {
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
    public queryOwnedChannnelById(channelId: string): Promise<Channel> {
        return new Promise( async() => {
            const filter = { "channel_id": channelId }
            await this.hiveservice.queryDBData(config.TABLE_CHANNELS, filter)
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
    public queryAndDispatchOwnedChannelById(channelId: string, dispatcher: Dispatcher<Channel>) {
        return new Promise<Channel>( async() => {
            await this.queryOwnedChannnelById(channelId)
        }).then (channel => {
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
        return new Promise( async() => {
            await this.hiveservice.queryDBData(config.TABLE_BACKUP_SUBSCRIBEDCHANNEL, {})
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
    public querySubscriptions(earlierThan: number, maximum: number): Promise<Channel[]> {
        return new Promise(async () => {
            try {
                const filter = {
                    "limit" : { "$lt": maximum },
                    "created": { "$gt": earlierThan }
                }
                const result = this.hiveservice.queryDBData(config.TABLE_BACKUP_SUBSCRIBEDCHANNEL, filter)
                logger.log('fetch subscription count success: ', result)
                const parseResult = this.parseBackupSubscribedChannel(result)

                parseResult.forEach(async item => {
                    const params = {
                        "channel_id": item.channelId,
                    }
                    const appid = config.ApplicationDID
                    const scriptName = config.SCRIPT_QUERY_SUBSCRIPTION_BY_CHANNELID
                    logger.log('Call script, targetDid:', item.targetDid, 'scriptName:', scriptName, 'params:', params)
                    let detailResult = await this.hiveservice.callScript(scriptName, params, item.targetDid, appid, this.userDid)
                    logger.log('Call script success, result is', detailResult)
                    return Channel.parse(item.targetDid, detailResult.find_message.items)
                })
            } catch (error) {
                logger.error('fetch subscription count error: ', error)
                throw new Error(error);
            }
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
    public queryAndDispatchSubscriptions(earlierThan: number,
        maximum: number,
        dispatcher: Dispatcher<Channel>) {

        return new Promise<Channel[]>( async() => {
            await this.querySubscriptions(earlierThan, maximum)
        }).then(channels => {
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
     * @returns
     */
    public createChannel(channelInfo: ChannelInfo): Promise<MyChannel> {
        return new Promise(async (resolve, reject) => {
            const doc = {
                "channel_id": channelInfo.getChannelId(),
                "name": channelInfo.getName(),
                "display_name": channelInfo.getDisplayName(),
                "intro": channelInfo.getDescription(),
                "avatar": channelInfo.getAvatar(),
                "created_at": channelInfo.getCreatedAt(),
                "updated_at": channelInfo.getUpdatedAt(),
                "type": channelInfo.getType(),
                "tipping_address": channelInfo.getReceivingAddress(),
                "nft": channelInfo.getNft(),
                "memo": channelInfo.getMmemo(),
                "category": channelInfo.getCategory(),
                "proof": channelInfo.getProof()
            }

            try {
                const insertResult = await this.hiveservice.insertDBData(config.TABLE_CHANNELS, doc)
                logger.log('Create channel success, result is: ', insertResult)
                const handleResult = MyChannel.parse(this.userDid, [doc])
                resolve(handleResult[0])
            } catch (error) {
                logger.error('Create channel error: ', error)
                reject(error)
            }
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

    public freezeChannel(_channelId: string): Promise<boolean> {
        throw new Error("Method not implemented");
        // TODO:
    }

    /**
     * TODO:
     *
     * @param _channelId
     * @returns
     */
    public unfreezeChannel(_channelId: string): Promise<boolean> {
        throw new Error("Method not implemented");
        // TODO:
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
    public deleteChannel(channelId: string): Promise<void> {
        const doc = {
            "updated_at": new Date().getTime(),
            "status": 1,
        }
        const filter = { "channel_id": channelId }
        const update = { "$set": doc}

        return this.hiveservice.updateOneDBData(config.TABLE_CHANNELS, filter, update,
                new UpdateOptions(false, true))
            .then (() => {
                // TODO: reserved
            }).catch (error => {
                logger.error("Delete channel error: ", error)
                throw new Error(error)
            }
    }

    /**
     * purge channel
     *
     * @param myChannel
     * @returns
     */
    public purgeChannel(_channelId: string): Promise<boolean> {
        throw new Error("Method not implemented");
        // TODO:
    }

    /**
     * Publish channel onto Feeds channel registry contract, which is an ERC721 compatbile
     * contract as Feeds channel collection.
     *
     * @param channelId the channel Identifier to be published on registry contract.
     * @returns
     */
    public publishChannel(_myChannel: MyChannel): Promise<boolean> {
        throw new Error("Method not implemented");
        // TODO:
    }

    /**
     *
     * @param _channelId
     * @returns
     */
    public unpublishChannel(_channelId: string): Promise<boolean> {
        throw new Error("Method not implemented");
        // TODO:
    }

    /**
     * TODO:
     *
     * @param channel
     * @returns
     */
    public subscribeChannel(channelEntry: ChannelEntry): Promise<Channel> {
        const params = {
            "channel_id": channelEntry.getChannelId(),
            "created_at": channelEntry.getCreatedAt(),
            "display_name": channelEntry.getDisplayName(),
            "updated_at": channelEntry.getUpdatedAt(),
            "status": channelEntry.getStatus()
        }

        return this.hiveservice.callScript(config.SCRIPT_SUBSCRIBE_CHANNEL, params, channelEntry.getTargetDid(), config.ApplicationDID, "TODO: userDid")
            .then (result => {
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
        const params = {
            "channel_id": channelEntry.getChannelId(),
            "updated_at": channelEntry.getUpdatedAt(),
            "status": channelEntry.getStatus()
        }
        const appid = config.ApplicationDID // todo
        return this.hiveservice.callScript(config.SCRIPT_UPDATE_SUBSCRIPTION, params, channelEntry.getTargetDid(), config.ApplicationDID, "TODO: userDid")
            .then (result => {
                // TODO
            }).catch (error => {
                logger.error("Unsbuscribe channel error:", error)
                throw new Error(error)
            })
   }
}
