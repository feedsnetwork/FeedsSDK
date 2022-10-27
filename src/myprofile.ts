
import { VerifiableCredential } from "@elastosfoundation/did-js-sdk";
import { RuntimeContext } from "./runtimecontext";
import { ChannelInfo, deserializeToChannelInfo } from "./channelinfo";
import { Logger } from "./utils/logger";
import { CollectionNames, ScriptingNames } from "./vault/constants"
import { ProfileHandler } from "./profilehandler";
import { DatabaseService, FilesService, InsertOptions } from "@elastosfoundation/hive-js-sdk";

const logger = new Logger("MyProfile")

export class MyProfile implements ProfileHandler {
    private context: RuntimeContext;
    private userDid: string;
    private walletAddress: string;

    private nameCredential: VerifiableCredential;
    private name: string;

    private descrCredetnial: VerifiableCredential;
    private descr: string;

    public constructor(context: RuntimeContext, userDid: string, walletAddress: string) {

        logger.info(`User Did: ${userDid}`);
        this.context = context;
        this.userDid = userDid;
        this.walletAddress = walletAddress;
    }

    public setNameCredential(credential: VerifiableCredential): MyProfile{
        this.nameCredential = credential;
        this.name = credential ? credential.getSubject().getProperty('name'): this.userDid;
        return this;
    }

    public setDescriptionCredential(credential: VerifiableCredential): MyProfile {
        this.descrCredetnial = credential
        this.descr = credential ? this.descrCredetnial.getSubject().getProperty('description'): ""
        return this;
    }

    public getUserDid(): string {
        return this.userDid;
    }

    public getWalletAddress(): string {
        return this.walletAddress;
    }

    public getName(): string {
        return this.name;
    }

    public getDescription(): string {
        return this.descr
    }

    private async getDatabaseService(): Promise<DatabaseService> {
        return (await this.context.getVault()).getDatabaseService()
    }

    private async getFilesService(): Promise<FilesService> {
        return (await this.context.getVault()).getFilesService()
    }

    // Get the number of channels created by yourself
    public async queryOwnedChannelCount(): Promise<number> {
        try {
            let db = await this.getDatabaseService()
            let result = await db.countDocuments(CollectionNames.CHANNELS, {}) // TODO: replace with countDocuments
            logger.debug(`Got the count of owned channels: ${result}`)
            return result
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
                channelInfos.push(deserializeToChannelInfo(this.userDid, item))
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
            let result = await db.findOne( CollectionNames.CHANNELS,
                { "channel_id": channelId }
            )
            logger.debug(`Query owned channel by channelId ${channelId}: ${result}`);
            return deserializeToChannelInfo(this.userDid, result)
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
    public async querySubscribedChannelCount(): Promise<number> {
        try {
            let db = await this.getDatabaseService()
            let result = await db.countDocuments(CollectionNames.BACKUP_SUBSCRIBEDCHANNELS, {}) // TODO: replace with countDocuments
            logger.debug(`Query subscription count: ${result}`)
            return result
        } catch (error) {
            logger.error("query subscription count error: ", error)
            throw new Error(error)
        }
    }

    /**
      * Query a list of channels subscribed by this profile.
      */
    public async querySubscribedChannels(_start: number, _end: number, _capcity = 30): Promise<ChannelInfo[]> {
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
                channels.push(deserializeToChannelInfo(target_did, callResult.find_message.items[0]))
            }
            logger.debug("query subscriptions channelInfo: ", channels)
            return channels
        } catch (error) {
            logger.error("query subscriptions error: ", error)
            throw new Error(error)
        }
    }

    /**
     * Query a specific subscribed channel.
     * @param channelId The channelId
     */
    public async querySubscribedChannelById(channelId: string): Promise<ChannelInfo> {
        try {
            const params = {
                "channel_id": channelId,
            }
            let db = await this.getDatabaseService()
            let result = await db.findOne(CollectionNames.BACKUP_SUBSCRIBEDCHANNELS, params)
            logger.debug(`Query subscribed channel by id result: ${result}`)

            const target_did = result.target_did.toString()
            let scriptRunner = await this.context.getScriptRunner(target_did)
            const callResult = await scriptRunner.callScript(
                ScriptingNames.SCRIPT_QUERY_CHANNEL_INFO,
                params,
                target_did,
                this.context.getAppDid()
            ) as any
            const channelInfo = deserializeToChannelInfo(target_did, callResult.find_message.items[0])
            logger.debug("Query subscribed channel by id channelInfo: ", channelInfo)
            return channelInfo
        } catch (error) {
            logger.error("Query subscribed channel by id error: ", error)
            throw new Error(error)
        }
    }

    /**
     * Create a channel on remote vault
     *
     */
    public async createChannel(channelInfo: ChannelInfo) {
        try {
            let doc = {
                "channel_id": channelInfo.getChannelId(),
                "name"      : channelInfo.getName(),
                "display_name"  : channelInfo.getDisplayName(),
                "intro"     : channelInfo.getDescription(),
                "avatar"    : channelInfo.getAvatar(),
                "created_at": channelInfo.getCreatedAt(),
                "updated_at": channelInfo.getUpdatedAt(),
                "tipping_address": channelInfo.getPaymentAddress(),
                "category"  : channelInfo.getCategory(),
                "type"      : channelInfo.getType(),
                "nft"       : "",
                "memo"      : "",
                "proof"     : ""
            }
            let db = await this.getDatabaseService()
            await db.insertOne(CollectionNames.CHANNELS, doc, new InsertOptions(false, true))
            logger.debug(`Create channel in success with channel info: ${doc}`)
        } catch (error) {
            logger.error("create channel error: ", error)
            throw new Error(error)
        }
    }

    /**
     * Subscribe to channel
     *
     * @returns
     */
    public async subscribeChannel(targetDid: string, channelId: string) {
        try {
            let channelDoc = {
                "channel_id": channelId,
                "created_at": Date.now,
                "display_name": this.name,
                "updated_at": Date.now,
                "status"    : false,
            }
            let scriptRunner = await this.context.getScriptRunner(targetDid)
            await scriptRunner.callScript(
                ScriptingNames.SCRIPT_SUBSCRIBE_CHANNEL,
                channelDoc,
                targetDid,
                this.context.getAppDid()
            )
            logger.debug(`Subscribed channel in success with doc: ${channelDoc}`)

            let doc = {
                "target_did": targetDid,
                "channel_id": channelId
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
     * @returns
     */
    public async unsubscribeChannel(targetDid: string, channelId: string) {
        try {
            let scriptRunner = await this.context.getScriptRunner(targetDid)
            await scriptRunner.callScript(
                ScriptingNames.SCRIPT_UNSUBSCRIBE_CHANNEL,
                { "channel_id": channelId },
                targetDid,
                this.context.getAppDid()
            )
            logger.debug(`Unsubscribed channel in scucess with channelId ${channelId}`)

            const doc = {
                "target_did": targetDid,
                "channel_id": channelId
            }

            let db = await this.getDatabaseService()
            await db.deleteOne(CollectionNames.BACKUP_SUBSCRIBEDCHANNELS, doc)
        } catch (error) {
            logger.error("Unsbuscribe channel error:", error)
            throw error
        }
    }

    public async downloadEssentilaAvatar(remoteHiveUrlPath: string): Promise<Buffer> {
        try {
            let runner = await this.context.getScriptRunner(this.userDid)
            return await runner.downloadFileByHiveUrl(remoteHiveUrlPath)
        } catch (error) {
            logger.error("Download Essentila avatar error:", error)
        }
    }

    public async downloadFeedsCusotmeAvatar(): Promise<Buffer> {
        try {
            const custome = 'custome'
            const fileService = await this.getFilesService()
            return await fileService.download(custome)
        } catch (error) {
            logger.error("Download feeds avatar error:", error)
        }
    }
}
