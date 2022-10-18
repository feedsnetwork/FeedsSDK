
import { VerifiableCredential } from "@elastosfoundation/did-js-sdk";
import { InsertResult } from "@elastosfoundation/hive-js-sdk"

import { RuntimeContext } from "./runtimecontext";
import { Channel } from "./channel";
import { ChannelInfo } from "./channelinfo";
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
    private descCredential: VerifiableCredential;
    private walletAddress: string;

    /**
    *
    * @param context： RuntimeContext
    * @param userDid：user did
    * @param name：user name
    * @param description：VerifiableCredential
    */
    public constructor(context: RuntimeContext, userDid: string, name: VerifiableCredential,
        description: VerifiableCredential, walletAddress: string) {  
        logger.info(`User Did: ${userDid}`);
        logger.info(`Name credential: ${JSON.stringify(name.toJSON())}`)
        if (description != null) {
            logger.info(`Description credential: ${JSON.stringify(description.toJSON())}`)
        }
        this.descCredential = description;
        this.walletAddress = walletAddress;  
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

    public getDescription(): string {
        return this.descCredential ? this.descCredential.getSubject().getProperty('description') : '';
    }

    public getWalletAddress(): string {
        return this.walletAddress;
    }

    public getOwnedChannelCount(): number {
        throw new Error("Method not implemented.");
    }

    public getOwnedChannels(): Channel[] {
        throw new Error("Method not implemented.");
    }

    // Get the number of channels created by yourself
    public async queryOwnedChannelCount(): Promise<number> {
        try {
            const result = await this.vault.queryDBData(CollectionNames.CHANNELS, {})
            logger.debug(`query owned channel count success: `, result);
            return result.length
        } catch (error) {
            logger.error(`query owned channel count error: `, error);
            throw new Error(error)
        }
    }

    // Get the channel created by yourself
    public async queryOwnedChannels(): Promise<ChannelInfo[]> {
        try {
            const result = await this.vault.queryDBData(CollectionNames.CHANNELS, {})
            logger.debug(`query owned channels success: `, result);
            let myChannelInfos = []
            result.forEach(item => {
                const channelInfo = ChannelInfo.parse(this.userDid, item)
                myChannelInfos.push(channelInfo)
            })
            logger.debug(`query owned channels infos: `, myChannelInfos);
            return myChannelInfos
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
            const filter = { "channel_id": channelId }
            const result = await this.vault.queryDBData(CollectionNames.CHANNELS, filter)
            logger.debug("query owned channnel by id success: ", result)
            return ChannelInfo.parse(this.userDid, result[0])
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
            const result = await this.vault.queryDBData(CollectionNames.BACKUP_SUBSCRIBEDCHANNELS, {})
            logger.debug("query subscription count success: ", result)
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
            const filter = {}

            const result = await this.vault.queryDBData(CollectionNames.BACKUP_SUBSCRIBEDCHANNELS, filter)
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
        } catch (error) {
            logger.error("query subscriptions error: ", error)
            throw new Error(error)
        }
    }

    // 为了测试：删除测试channel
    public async deleteChannel(channelId: string): Promise<void> {
        let filter = { "channel_id": channelId }
        return await this.vault.deleateOneDBData(CollectionNames.CHANNELS, filter)
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
            const result = await this.vault.insertDBData(CollectionNames.CHANNELS, doc)
            logger.debug("create channel success: ", result)

            return MyChannel.parse(this.userDid, this.context, [doc])
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
            const result = await this.vault.callScript(ScriptingNames.SCRIPT_SUBSCRIBE_CHANNEL, params,
                targetDid, appDid)
            logger.debug("subscribe channel success: ", result)

            return this.subscribeChannelBackup(channelEntry.getTargetDid(), channelEntry.getChannelId())
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
    public async unsubscribeChannel(channelEntry: ChannelEntry): Promise<void> {
        try {
            const params = {
                "channel_id": channelEntry.getChannelId(),
            }
            logger.debug("unsubscribe channel params: ", params)
            const result = await this.vault.callScript(ScriptingNames.SCRIPT_UNSUBSCRIBE_CHANNEL, params,
                channelEntry.getTargetDid(), this.context.getAppDid())
            logger.debug("unsubscribe channel success: ", result)
            return this.unsubscribeChannelBackup(channelEntry.getTargetDid(), channelEntry.getChannelId())
        } catch (error) {
            logger.error("Unsbuscribe channel error:", error)
            throw error
        }
    }

    private async subscribeChannelBackup(targetDid: string, channelId: string): Promise<InsertResult> {
        try {
            const doc = {
                "target_did": targetDid,
                "channel_id": channelId
            }
            logger.debug("subscribe channel backup params: ", doc)
            return await this.vault.insertDBData(CollectionNames.BACKUP_SUBSCRIBEDCHANNELS, doc)
        } catch (error) {
            logger.error("Subscribe channel backup error:", error)
            throw error
        }
    }

    private async unsubscribeChannelBackup(targetDid: string, channelId: string): Promise<void> {
        try {
            const doc = {
                "target_did": targetDid,
                "channel_id": channelId
            }
            logger.debug("unsubscribe channel backup params: ", doc)
            return await this.vault.deleateOneDBData(CollectionNames.BACKUP_SUBSCRIBEDCHANNELS, doc)
        } catch (error) {
            logger.error("Unsubscribe channel backup error:", error)
            throw error
        }
    }
}
