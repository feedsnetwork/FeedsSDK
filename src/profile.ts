import { RuntimeContext } from "./runtimecontext";
import { ChannelInfo } from "./channelinfo";
import { ProfileHandler } from "./profilehandler";
import { hiveService as VaultService } from "./hiveService"
import { CollectionNames as collections, ScriptingNames as scripts } from "./vault/constants"
import { Logger } from './utils/logger'

const logger = new Logger("Profile")

export class Profile implements ProfileHandler {
    private context: RuntimeContext;
    private readonly targetDid: string;
    private readonly userDid: string;
    private readonly displayName: string
    private vault: VaultService

    /**
    * @param context: RuntimeContext instance
    * @param userDid: user did
    * @param targetDid: owner of this profile
    * @param displayName: Display name for this profile
    */
    public constructor(context: RuntimeContext, userDid: string, targetDid: string, displayName: string) {
        this.context = context;
        this.userDid = userDid;
        this.targetDid = targetDid
        this.displayName = displayName
        this.vault = new VaultService()
    }

    // Get user did
    public getUserDid(): string {
        return this.userDid
    }

    // Get owner of this profile
    public getTargetDid(): string {
        return this.targetDid
    }

    // Get display name for this profile
    public getDisplayName(): string {
        return this.displayName
    }

    /**
    * Query the number of all channels created by this profile
    */
    public async queryOwnedChannelCount(): Promise<number> {
        try {
            const result = await this.vault.callScript(
                scripts.SCRIPT_PRIFILE_CHANNELS,
                {},
                this.targetDid,
                this.context.getAppDid()
            )
            logger.debug(`Call script to query owned channel acount: ${result}`)

            let count = result.find_message.total
            logger.debug(`Got owned channel count: ${count}`)
            return count
        } catch (error) {
            logger.error('query owned channels count error: ', error)
            throw new Error(error)
        }
    }

    /**
    * Query all channels created by this profile
    */
    public async queryOwnedChannels(): Promise<ChannelInfo[]> {
        try {
            let result = await this.vault.callScript(
                scripts.SCRIPT_PRIFILE_CHANNELS,
                {},
                this.targetDid,
                this.context.getAppDid()
            )
            logger.debug(`Call script to query owned channels: ${result}`);

            let items = result.find_message.items
            let channelInfos = []
            items.forEach((item: any) => {
                channelInfos.push(ChannelInfo.parse(this.targetDid, item))
            })

            logger.debug(`Got owned channels: ${channelInfos}`);
            return channelInfos
        } catch (error) {
            logger.error('query owned channels error: ', error)
            throw new Error(error)
        }
    }

    S/**
    * Query the channel information of the specified channelid under this profile
    * @param channelId：specified channel id
    */
    public async queryOwnedChannnelById(channelId: string): Promise<ChannelInfo> {
        try {
            const result = await this.vault.callScript(
                scripts.SCRIPT_QUERY_CHANNEL_INFO,
                {"channel_id": channelId,},
                this.targetDid,
                this.context.getAppDid()
            )
            logger.debug(`Call script to query owned channel by id: ${result}`)

            const items = result.find_message.items
            let channelInfo =  ChannelInfo.parse(this.targetDid, items[0])

            logger.debug(`Got owned channel by Id: ${channelInfo}`);
            return channelInfo;
        } catch (error) {
            logger.error("query owned channel by id error: ", error)
            throw new Error(error)
        }
    }

    /**
     * Query the number of channels subscribed by this profile
    */
    public async querySubscriptionCount(): Promise<number> {
        try {
            let result = await this.vault.callScript(
                scripts.SCRIPT_PRIFILE_SUBSCRIPTIONS,
                {},
                this.targetDid,
                this.context.getAppDid()
            )
            logger.debug(`Call script to subscription count: ${result}`)

            let count = result.find_message.total;
            logger.debug(`Got subscription count: ${count}`)
            return count
        } catch (error) {
            logger.error("query subscription Count error: ", error)
            throw new Error(error)
        }
    }

    /**
    * Query the channels subscribed to by this profile
    */
    public async querySubscriptions(): Promise<ChannelInfo[]> {
        try {
            const result = await this.vault.callScript(
                scripts.SCRIPT_PRIFILE_SUBSCRIPTIONS,
                {},
                this.targetDid,
                this.context.getAppDid()
            )
            logger.debug(`Call script to query subscriptions: ${result}`)

            const items = result.find_message.items
            let subscriptions = []

            for (let index = 0; index < items.length; index++) {
                const item = items[index]
                const channel_id = item.channel_id
                const target_did = item.target_did.toString()

                const info = await this.vault.callScript(
                    scripts.SCRIPT_QUERY_CHANNEL_INFO,
                    { "channel_id": channel_id },
                    channel_id,
                    this.context.getAppDid()
                )
                subscriptions.push(ChannelInfo.parse(target_did, info.find_message.items[0]))
            }

            logger.debug(`Susbscriptions: ${subscriptions}`)
            return subscriptions
        } catch (error) {
            logger.error('query subscription channels error: ', error)
            throw new Error(error)
        }
    }

    public static parse(context: RuntimeContext, userDid: string, result: any): Profile {
        const targetDid = result.user_did
        const displayName = result.display_name
        const profile = new Profile(context, userDid, targetDid, displayName)

        return profile
    }
}
