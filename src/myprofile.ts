
import { VerifiableCredential } from "@elastosfoundation/did-js-sdk";
import { InsertResult } from "@elastosfoundation/hive-js-sdk"

import { RuntimeContext } from "./runtimecontext";
import { Channel } from "./channel";
import { ChannelInfo } from "./channelinfo";
import { Dispatcher } from "./dispatcher";
import { Logger } from "./utils/logger";
import { hiveService as VaultService } from "./hiveService"
import { CollectionNames, ScriptingNames } from "./vault/constants"
import { MyChannel } from "./mychannel";
import { ChannelEntry } from "./channelentry";
import { ProfileHandler } from "./profilehandler";

const logger = new Logger("MyProfile")

export class MyProfile implements ProfileHandler {
    private context: RuntimeContext;

    private userDid: string;
    private nameCredential: VerifiableCredential;
    private vault: VaultService;
/**
 *
 * @param context： RuntimeContext
 * @param userDid：user did
 * @param name：user name
 * @param description：VerifiableCredential
 */
    public constructor(context: RuntimeContext, userDid: string, name: VerifiableCredential,
        description: VerifiableCredential) {

        logger.info(`User Did: ${userDid}`);
        logger.info(`Name credential: ${JSON.stringify(name.toJSON())}`)
        if (description != null) {
            logger.info(`Description credential: ${JSON.stringify(description.toJSON())}`)
        }

        this.context = context;
        this.userDid = userDid;
        this.nameCredential = name;
        this.vault = new VaultService()
    }
// Get user did
    public getUserDid(): string {
        return this.userDid;
    }

    // get user name
    public getName(): string {
        return this.nameCredential ? this.nameCredential.getSubject().getProperty('name'): this.userDid;
    }

    // Get the number of channels created by yourself
    public queryOwnedChannelCount(): Promise<number> {
        return this.vault.queryDBData(CollectionNames.CHANNELS, {}).then(result => {
            logger.debug(`query owned channel count success: `, result);
            return result.length
        }).catch(error => {
            logger.error(`query owned channel count error: `, error);
            throw new Error(error)
        })
    }

    // Get the channel created by yourself
    public queryOwnedChannels(): Promise<ChannelInfo[]> {
        return this.vault.queryDBData(CollectionNames.CHANNELS, {}).then(result => {
            logger.debug(`query owned channels success: `, result);
            let myChannelInfos = []
            result.forEach(item => {
                const channelInfo = ChannelInfo.parse(this.userDid, item)
                myChannelInfos.push(channelInfo)
            })
            logger.debug(`query owned channels infos: `, myChannelInfos);
            return myChannelInfos
        }).catch(error => {
            logger.error(`query owned channels error: `, error);
            throw new Error(error)
        })
    }

/**
 * Get the channel created by yourself
 * @param dispatcher
 */
    public queryAndDispatchOwnedChannels(dispatcher: Dispatcher<ChannelInfo>) {
        return this.queryOwnedChannels().then (channels => {
            channels.forEach(item => {
                dispatcher.dispatch(item)
            })
        }).catch (error => {
            throw new Error(error)
        })
    }

/**
 * Get the information of the specified channelId
 * @param channelId： specified channelId
 */
    public queryOwnedChannnelById(channelId: string): Promise<ChannelInfo> {
        const filter = { "channel_id": channelId }
        return this.vault.queryDBData(CollectionNames.CHANNELS, filter).then(result => {
            logger.debug("query owned channnel by id success: ", result)
            return ChannelInfo.parse(this.userDid, result[0])
        }).catch(error => {
            logger.error("query owned channnel by id error: ", error)
            throw new Error(error)
        })
    }

/**
 * Get the information of the specified channelId
 * @param channelId： specified channelId
 * @param dispatcher
 */
    public queryAndDispatchOwnedChannelById(channelId: string, dispatcher: Dispatcher<ChannelInfo>) {
        return this.queryOwnedChannnelById(channelId).then (channel => {
            dispatcher.dispatch(channel)
        }).catch (error => {
            throw new Error(error)
        })
    }

    /**
     * Query the total number of channels subscribed by this profile.
     *
     * @returns A promise object that contains the number of subscribed channels.
     */
    public querySubscriptionCount(): Promise<number> {
        return this.vault.queryDBData(CollectionNames.BACKUP_SUBSCRIBEDCHANNELS, {}).then(result => {
            logger.debug("query subscription count success: ", result)
            return result.length
        }).catch(error => {
            logger.error("query subscription count error: ", error)
            throw new Error(error)
        })
    }

    /**
      * Query a list of channels subscribed by this profile.
      */
    public querySubscriptions(): Promise<ChannelInfo[]> {
        const filter = {}

        return this.vault.queryDBData(CollectionNames.BACKUP_SUBSCRIBEDCHANNELS, filter).then(async result => {
            logger.debug("query subscriptions success: ", result)
            let results = []
            for (let index = 0; index < result.length; index++) {
                const item = result[index]
                const channel_id = item.channel_id
                const target_did = item.target_did.toString()
                const params = {
                    "channel_id": channel_id,
                }
                const callScriptResult = await this.vault.callScript(ScriptingNames.SCRIPT_QUERY_CHANNEL_INFO, params, target_did, this.context.getAppDid())
                const channelInfo = ChannelInfo.parse(target_did, callScriptResult.find_message.items[0])
                results.push(channelInfo)
            }
            logger.debug("query subscriptions channelInfo: ", results)

            return results
        }).catch(error => {
            logger.error("query subscriptions error: ", error)
            throw new Error(error)
        })
    }

    /**
      * Query a list of channels subscribed by this profile and dispatch them to customized routine
      * to handle.
      */
    public queryAndDispatchSubscriptions(dispatcher: Dispatcher<ChannelInfo>) {

        return this.querySubscriptions().then(channels => {
            channels.forEach(item => {
                dispatcher.dispatch(item)
            })
        }).catch(error => {
            throw new Error(error)
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
    public createChannel(channelInfo: ChannelInfo): Promise<MyChannel> {
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
        logger.debug("create channel param: ", doc)
        return this.vault.insertDBData(CollectionNames.CHANNELS, doc).then(result => {
            logger.debug("create channel success: ", result)

            return MyChannel.parse(this.userDid, this.context, [doc])
        }).catch(error => {
            logger.error("create channel error: ", error)
            throw new Error(error)
        })
    }

    /**
     * Subscribe to channel
     *
     * @param channel：Information about the subscribed channel
     * @returns
     */
    public subscribeChannel(channelEntry: ChannelEntry) {
            const params = {
                "channel_id": channelEntry.getChannelId(),
                "created_at": channelEntry.getCreatedAt(),
                "display_name": channelEntry.getDisplayName(),
                "updated_at": channelEntry.getUpdatedAt(),
                "status"    : channelEntry.getStatus()
            }
        logger.debug("subscribe channel params: ", params)
        const targetDid = channelEntry.getTargetDid()
        const appDid = this.context.getAppDid()
        return this.vault.callScript(ScriptingNames.SCRIPT_SUBSCRIBE_CHANNEL, params,
            targetDid, appDid).then(result => {
                logger.debug("subscribe channel success: ", result)

                return this.subscribeChannelBackup(channelEntry.getTargetDid(), channelEntry.getChannelId())
            }).catch(error => {
                logger.error("Sbuscribe channel error:", error)
                throw error
        })
    }

    /**
     * unsubscribe channel
     *
     * @param channel：Unsubscribed channel information
     * @returns
     */
    public unsubscribeChannel(channelEntry: ChannelEntry): Promise<void> {
            const params = {
                "channel_id": channelEntry.getChannelId(),
            }
        logger.debug("unsubscribe channel params: ", params)
        return this.vault.callScript(ScriptingNames.SCRIPT_UNSUBSCRIBE_CHANNEL, params,
            channelEntry.getTargetDid(), this.context.getAppDid()).then(result => {
                logger.debug("unsubscribe channel success: ", result)
                return this.unsubscribeChannelBackup(channelEntry.getTargetDid(), channelEntry.getChannelId())
            }).catch(error => {
                logger.error("Unsbuscribe channel error:", error)
                throw error
            })
    }

    private subscribeChannelBackup(targetDid: string, channelId: string): Promise<InsertResult> {
        const doc = {
            "target_did": targetDid,
            "channel_id": channelId
        }
        logger.debug("subscribe channel backup params: ", doc)
        return this.vault.insertDBData(CollectionNames.BACKUP_SUBSCRIBEDCHANNELS, doc).catch(error => {
            logger.error("Subscribe channel backup error:", error)
            throw error
        })
    }

    private unsubscribeChannelBackup(targetDid: string, channelId: string): Promise<void> {
        const doc = {
            "target_did": targetDid,
            "channel_id": channelId
        }
        logger.debug("unsubscribe channel backup params: ", doc)
        return this.vault.deleateOneDBData(CollectionNames.BACKUP_SUBSCRIBEDCHANNELS, doc)
            .catch(error => {
                logger.error("Unsubscribe channel backup error:", error)
                throw error
            })
    }
}
