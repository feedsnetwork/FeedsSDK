
import { VerifiableCredential } from "@elastosfoundation/did-js-sdk";
import { RuntimeContext } from "./runtimecontext";
import { ChannelInfo } from "./channelinfo";
import { Logger } from "./utils/logger";
import { CollectionNames, ScriptingNames } from "./vault/constants"
import { MyChannel } from "./mychannel";
import { ChannelEntry } from "./channelentry";
import { ProfileHandler } from "./profilehandler";
import { DatabaseService, InsertOptions} from "@elastosfoundation/hive-js-sdk/typings";

const logger = new Logger("MyProfile")

export class MyProfile implements ProfileHandler {
    private context: RuntimeContext;

    private userDid: string;
    private nameCredential: VerifiableCredential;
    /**
    *
    * @param context： RuntimeContext
    * @param userDid：user did
    * @param name：user name
    * @param description：VerifiableCredential
    */
    public constructor(context: RuntimeContext,
        userDid: string,
        name: VerifiableCredential,
        description: VerifiableCredential) {

        logger.info(`User Did: ${userDid}`);
        logger.info(`Name credential: ${JSON.stringify(name.toJSON())}`)
        if (description != null) {
            logger.info(`Description credential: ${JSON.stringify(description.toJSON())}`)
        }

        this.context = context;
        this.userDid = userDid;
        this.nameCredential = name;
    }

    // Get user did
    public getUserDid(): string {
        return this.userDid;
    }

    // get user name
    public getName(): string {
        return this.nameCredential ? this.nameCredential.getSubject().getProperty('name'): this.userDid;
    }

    private async getDatabaseService(): Promise<DatabaseService> {
        return (await this.context.getVault()).getDatabaseService()
    }

    // Get the number of channels created by yourself
    public async queryOwnedChannelCount(): Promise<number> {
        try {
            let db = await this.getDatabaseService()
            let result = await db.findMany(CollectionNames.CHANNELS, {})
            logger.debug(`Got the count of owned channels: ${result.length}`)
            return result.length
        } catch (error) {
            logger.error(`query owned channel count error: `, error);
            throw new Error(error)
        }
    }

    // Get the channel created by yourself
    public async queryOwnedChannels(): Promise<ChannelInfo[]> {
        try {
            let db = await this.getDatabaseService()
            let result = await db.findMany(CollectionNames.CHANNELS, {})
            logger.debug(`Query owned channels: ${result}`)

            let channelInfos = []
            result.forEach(item => {
                channelInfos.push(ChannelInfo.parseFrom(this.userDid, item))
            })
            logger.debug(`Got owned channels: ${result}`)
            return channelInfos
        } catch (error) {
            logger.error(`query owned channels error: `, error);
            throw new Error(error)
        }
    }

    /**
    * Get the information of the specified channelId
    * @param channelId： specified channelId
    */
    public async queryOwnedChannnelById(channelId: string): Promise<ChannelInfo> {
        try {
            let db = await this.getDatabaseService()
            let result = await db.findMany( CollectionNames.CHANNELS,
                { "channel_id": channelId }
            )
            logger.debug(`Query owned channel by channelId ${channelId}: ${result}`);
            return ChannelInfo.parseFrom(this.userDid, result[0])
        } catch (error) {
            logger.error("query owned channnel by id error: ", error)
            throw new Error(error)
        }
    }

    /**
     * Query the total number of channels subscribed by this profile.
     *
     * @returns A promise object that contains the number of subscribed channels.
     */
    public async querySubscriptionCount(): Promise<number> {
        try {
            let db = await this.getDatabaseService()
            let result = await db.findMany(CollectionNames.BACKUP_SUBSCRIBEDCHANNELS, {})
            logger.debug(`Query subscription count: ${result.length}`)
            return result.length
        } catch (error) {
            logger.error("query subscription count error: ", error)
            throw new Error(error)
        }
    }

    /**
      * Query a list of channels subscribed by this profile.
      */
    public async querySubscriptions(): Promise<ChannelInfo[]> {
        try {
            let db = await this.getDatabaseService()
            let result = await db.findMany(CollectionNames.BACKUP_SUBSCRIBEDCHANNELS, {})
            logger.debug(`Query subscriptions result: ${result}`)

            let channels = []
            for (let index = 0; index < result.length; index++) {
                const item = result[index]
                const channel_id = item.channel_id
                const target_did = item.target_did.toString()
                const params = {
                    "channel_id": channel_id,
                }

                let scriptRunner = await this.context.getScriptRunner(target_did)
                const callResult = await scriptRunner.callScript(
                    ScriptingNames.SCRIPT_QUERY_CHANNEL_INFO,
                    params,
                    target_did,
                    this.context.getAppDid()
                ) as any
                channels.push(ChannelInfo.parseFrom(target_did, callResult.find_message.items[0]))
            }
            logger.debug("query subscriptions channelInfo: ", channels)
            return channels
        } catch (error) {
            logger.error("query subscriptions error: ", error)
            throw new Error(error)
        }
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
    public async createChannel(channelInfo: ChannelInfo): Promise<MyChannel> {
        try {
            let doc = {
                "channel_id": channelInfo.getChannelId(),
                "name"      : channelInfo.getName(),
                "display_name"  : channelInfo.getDisplayName(),
                "intro"     : channelInfo.getDescription(),
                "avatar"    : channelInfo.getAvatar(),
                "created_at": channelInfo.getCreatedAt(),
                "updated_at": channelInfo.getUpdatedAt(),
                "type"      : channelInfo.getType(),
                "tipping_address": channelInfo.getPaymentAddress(),
                "nft"       : channelInfo.getNft(),
                "memo"      : channelInfo.getMmemo(),
                "category"  : channelInfo.getCategory(),
                "proof"     : channelInfo.getProof()
            }
            let db = await this.getDatabaseService()
            await db.insertOne(CollectionNames.CHANNELS, doc, new InsertOptions(false, true))
            logger.debug(`Create channel in success with channel info: ${doc}`)

            return MyChannel.parseFrom(this.context, this.userDid, [doc])
        } catch (error) {
            logger.error("create channel error: ", error)
            throw new Error(error)
        }
    }

    /**
     * Subscribe to channel
     *
     * @param channel：Information about the subscribed channel
     * @returns
     */
    public async subscribeChannel(channelEntry: ChannelEntry) {
        try {
            let channelDoc = {
                "channel_id": channelEntry.getChannelId(),
                "created_at": channelEntry.getCreatedAt(),
                "display_name": channelEntry.getDisplayName(),
                "updated_at": channelEntry.getUpdatedAt(),
                "status"    : channelEntry.getStatus()
            }
            let scriptRunner = await this.context.getScriptRunner(channelEntry.getTargetDid())
            await scriptRunner.callScript(
                ScriptingNames.SCRIPT_SUBSCRIBE_CHANNEL,
                channelDoc,
                channelEntry.getTargetDid(),
                this.context.getAppDid()
            )
            logger.debug(`Subscribed channel in success with doc: ${channelDoc}`)

            let doc = {
                "target_did": channelEntry.getTargetDid(),
                "channel_id": channelEntry.getChannelId()
            }
            let db = await this.getDatabaseService()
            await db.insertOne(CollectionNames.BACKUP_SUBSCRIBEDCHANNELS, doc, new InsertOptions(false, true))
        } catch (error) {
            logger.error("Sbuscribe channel error:", error)
            throw error
        }
    }

    /**
     * unsubscribe channel
     *
     * @param channel：Unsubscribed channel information
     * @returns
     */
    public async unsubscribeChannel(channelEntry: ChannelEntry) {
        try {
            let scriptRunner = await this.context.getScriptRunner(channelEntry.getTargetDid())
            await scriptRunner.callScript(
                ScriptingNames.SCRIPT_UNSUBSCRIBE_CHANNEL,
                { "channel_id": channelEntry.getChannelId() },
                channelEntry.getTargetDid(),
                this.context.getAppDid()
            )
            logger.debug(`Unsubscribed channel in scucess with entry ${channelEntry.getChannelId()}`)

            const doc = {
                "target_did": channelEntry.getTargetDid(),
                "channel_id": channelEntry.getChannelId()
            }

            let db = await this.getDatabaseService()
            await db.deleteOne(CollectionNames.BACKUP_SUBSCRIBEDCHANNELS, doc)
        } catch (error) {
            logger.error("Unsbuscribe channel error:", error)
            throw error
        }
    }
}
