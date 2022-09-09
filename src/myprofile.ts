
import { AppContext } from "./appcontext";
import { Channel } from "./channel";
import { ChannelInfo } from "./channelinfo";
import { Dispatcher } from "./dispatcher";
<<<<<<< HEAD
import { Logger } from "./utils/logger";
import { hiveService as VaultService } from "./hiveService"
import { UpdateOptions } from "@elastosfoundation/hive-js-sdk"
import { CollectionNames, ScriptingNames } from "./vault/constants"
import { MyChannel } from "./mychannel";
import { ChannelEntry } from "./channelentry";

const logger = new Logger("Channel")

/*
type SubscribedChannel = {
    targetDid: string,// 订阅channel的创建者的did
    channelId: string
} */
=======
>>>>>>> d3ec102 (Update a new version)

export class MyProfile {
    private appContext: AppContext;
    private vault: VaultService;
    private userDid: string;

    public getOwnedChannelCount(): number {
        throw new Error("Method not implemented.");
    }

    public getOwnedChannels(): Channel[] {
        throw new Error("Method not implemented.");
    }

    public queryOwnedChannelCount(): Promise<number> {
<<<<<<< HEAD
        return new Promise( (resolve, _reject) => {
            const result = this.vault.queryDBData(CollectionNames.CHANNELS, {})
            // TODO: error.
            resolve(result)
        }).then (result => {
            return MyChannel.parse(this.userDid, result).length
        }).catch (error => {
            logger.error('fetch own channel count error: ', error)
            throw new Error(error)
        });
=======
        throw new Error("Method not implemented.");
>>>>>>> d3ec102 (Update a new version)
    }

    public queryOwnedChannels(): Promise<ChannelInfo[]> {
<<<<<<< HEAD
        return new Promise( (resolve, _reject) => {
            const result = this.vault.queryDBData(CollectionNames.CHANNELS, {})
            // TODO: error
            resolve(result)
        }).then (result => {
            return MyChannel.parse(this.userDid, result);
        }).catch (error => {
            logger.error('query owned channel error: ', error)
            throw new Error(error)
        })
=======
        throw new Error("Method not implemented.");
>>>>>>> d3ec102 (Update a new version)
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
<<<<<<< HEAD
        return new Promise((resolve, _reject) => {
            const filter = { "channel_id": channelId }
            const result = this.vault.queryDBData(CollectionNames.CHANNELS, filter)
            // TODO: error.
            resolve(result)
        }).then (result => {
            return MyChannel.parseOne(this.userDid, result)
        }).catch (error => {
            logger.error('fetch own channels error: ', error)
            throw new Error(error);
        })
=======
        throw new Error("Method not implemented.");
>>>>>>> d3ec102 (Update a new version)
    }

    public queryAndDispatchOwnedChannelById(channelId: string, dispatcher: Dispatcher<ChannelInfo>) {
        return this.queryOwnedChannnelById(channelId).then (channel => {
            dispatcher.dispatch(channel)
        }).catch (error => {
<<<<<<< HEAD
            throw new Error(error)
        })
    }

    public getSubscriptionCount(): number {
        throw new Error("Method not implemented.");
    }

    /**
     * Query the total number of channels subscribed by this profile.
     *
     * @returns A promise object that contains the number of subscribed channels.
     */
    public querySubscriptionCount(): Promise<number> {
        return new Promise( (resolve, _reject) => {
            const result = this.vault.queryDBData(CollectionNames.BACKUP_SUBSCRIBEDCHANNELS, {})
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
            const result = this.vault.queryDBData(CollectionNames.BACKUP_SUBSCRIBEDCHANNELS, filter)
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

        return this.querySubscriptions(earlierThan, maximum).then (channels => {
            channels.forEach(item => {
                dispatcher.dispatch(item)
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

            const result = this.vault.insertDBData(CollectionNames.CHANNELS, doc)
            // TODO:
            resolve(result)
        }).then( result => {
            // TODO:
            const channelInfos = MyChannel.parse(this.userDid, [result])
            return channelInfos[0]
        }).catch (error => {
            throw new Error(error)
        })
=======
            throw new Error(error)
        })
    }

    public getSubscriptionCount(): number {
        throw new Error("Method not implemented.");
>>>>>>> d3ec102 (Update a new version)
    }

    public querySubscriptionCount(): Promise<number> {
        throw new Error("Method not implemented.");
    }

    public querySubscriptions(earlierThan: number, upperLimit: number): Promise<ChannelInfo[]> {
        throw new Error("Method not implemented.");
    }

    public queryAndDispatchSubscriptions(earlierThan: number, upperLimit: number,
        dispatcher: Dispatcher<ChannelInfo>) {

<<<<<<< HEAD
            const result = this.vault.updateOneDBData(CollectionNames.CHANNELS, filter, update,
                new UpdateOptions(false, true))
            // TODO: error.
            resolve(result)
        }).then (() => {
            // TODO: reserved
=======
        return this.querySubscriptions(earlierThan, upperLimit).then (channels => {
            channels.forEach(item => {
                dispatcher.dispatch(item)
            })
>>>>>>> d3ec102 (Update a new version)
        }).catch (error => {
            throw new Error(error)
        })
    }
<<<<<<< HEAD

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

            const result = this.vault.callScript(ScriptingNames.SCRIPT_SUBSCRIBE_CHANNEL, params,
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
            const result = this.vault.callScript(ScriptingNames.SCRIPT_UPDATE_SUBSCRIPTION, params,
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
=======
>>>>>>> d3ec102 (Update a new version)
}
