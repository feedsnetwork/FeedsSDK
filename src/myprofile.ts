
import { VerifiableCredential } from "@elastosfoundation/did-js-sdk";
import { RuntimeContext } from "./runtimecontext";
import { ChannelInfo, deserializeToChannelInfo } from "./channelinfo";
import { Logger } from "./utils/logger";
import { CollectionNames, ScriptingNames } from "./vault/constants"
import { ProfileHandler } from "./profilehandler";
import { DatabaseService, FilesService, InsertOptions } from "@elastosfoundation/hive-js-sdk";
import { PostBody } from "./postbody";

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
        this.descr = credential ? credential.getSubject().getProperty('description'): ""
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

    public getNameCredential(): VerifiableCredential {
        return this.nameCredential
    }

    public getDescription(): string {
        return this.descr
    }

    public getDescriptionCredential(): VerifiableCredential {
        return this.descrCredetnial
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
            let result = await db.countDocuments(CollectionNames.CHANNELS, {})
            logger.debug(`Got the count of owned channels: ${result}`)
            return result
        } catch (error) {
            throw new Error(`Query owned channel count error: ${error}`)
        }
    }

    // Get the channel created by yourself
    public async queryOwnedChannels(): Promise<ChannelInfo[]> {
        try {
            let db = await this.getDatabaseService()
            let result = await db.findMany(CollectionNames.CHANNELS, {})
            logger.debug(`Query owned channels: ${result}`)

            let channels = []
            result.forEach(item => {
                channels.push(deserializeToChannelInfo(this.userDid, item))
            })
            logger.debug(`Got owned channels: ${result}`)
            return channels
        } catch (error) {
            throw new Error(`Query owned channels error ${error}`)
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
            throw new Error(`Query owned channel by channelid ${channelId} error ${error}`)
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
            let result = await db.countDocuments(CollectionNames.BACKUP_SUBSCRIBEDCHANNELS, {})
            logger.debug(`Query subscription count: ${result}`)
            return result
        } catch (error) {
            throw new Error(`Query subscribed channel count error: ${error}`)
        }
    }

    /**
      * Query a list of channels subscribed by this profile.
      */
    public async querySubscribedChannels(_startTime: number, _endTime: number, _capcity = 30): Promise<ChannelInfo[]> {
        try {
            let db = await this.getDatabaseService()
            let result = await db.findMany(CollectionNames.BACKUP_SUBSCRIBEDCHANNELS, {})
            logger.debug(`Query subscriptions result: ${result}`)

            let channels = []
            for (let index = 0; index < result.length; index++) {
                let item = result[index]
                let channel_id = item.channel_id
                let target_did = item.target_did.toString()
                let params = {
                    "channel_id": channel_id,
                }
                let callRunner = await this.context.getScriptRunner(target_did)
                let callResult = await callRunner.callScript<any>(
                    ScriptingNames.SCRIPTV1_QUERY_CHANNELINFO,
                    params,
                    target_did,
                    this.context.getAppDid()
                )
                if (callResult.find_message.items.length > 0) {
                    channels.push(deserializeToChannelInfo(target_did, callResult.find_message.items[0]))
                }
            }
            logger.debug("query subscriptions channelInfo: ", channels)
            return channels
        } catch (error) {
            throw new Error(`Query subscribed channels error ${error}`)
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

            let target_did = result.target_did.toString()
            let scriptRunner = await this.context.getScriptRunner(target_did)
            let callResult = await scriptRunner.callScript(
                ScriptingNames.SCRIPTV1_QUERY_CHANNELINFO,
                params,
                target_did,
                this.context.getAppDid()
            ) as any
            let channel = deserializeToChannelInfo(target_did, callResult.find_message.items[0])
            logger.debug("Query subscribed channel by id channelInfo: ", channel)
            return channel
        } catch (error) {
            throw new Error(`Query subscribed channel by channelId: ${channelId} error ${error}`)
        }
    }

    queryLikedPostsNumber(): Promise<number> {
        throw new Error("Method not implemented.");
    }
    queryLikedPosts(startTime: number, endTime: number, capacity: number): Promise<PostBody[]> {
        throw new Error("Method not implemented.");
    }
    queryLikedPostById(likeId: string): Promise<PostBody> {
        throw new Error("Method not implemented.");
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
            throw new Error(`Create a new channel error: ${error}`)
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
                "created_at": Date.now(),
                "display_name": this.name ? this.name : '',
                "updated_at": Date.now(),
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
            throw new Error(`Subscribe to a channel ${channelId} running by ${targetDid} error: ${error}`)
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
            throw new Error(`Unsbuscribe channel ${channelId} running by ${targetDid} error: ${error}`)
        }
    }

    public async downloadEssentilaAvatar(avatarPath: string): Promise<Buffer> {
        try {
            let runner = await this.context.getScriptRunner(this.userDid)
            return await runner.downloadFileByHiveUrl(avatarPath)
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
