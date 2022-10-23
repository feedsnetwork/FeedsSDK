import { RuntimeContext } from "./runtimecontext";
import { ChannelInfo } from "./channelinfo";
import { ProfileHandler } from "./profilehandler";
import { ScriptingNames as scripts } from "./vault/constants"
import { Logger } from './utils/logger'

const logger = new Logger("Profile")

export class Profile implements ProfileHandler {
    private context: RuntimeContext;
    private userDid: string;
    private displayName: string

    /**
    * @param context: RuntimeContext instance
    * @param targetDid: owner of this profile
    * @param displayName: Display name for this profile
    */
    public constructor(context: RuntimeContext, userDid: string, displayName: string) {
        this.context = context;
        this.userDid = userDid
        this.displayName = displayName
    }

    // Get user did
    public getUserDid(): string {
        return this.userDid
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
            let runner = await this.context.getScriptRunner(this.userDid)
            let result = await runner.callScript(
                scripts.SCRIPT_PRIFILE_CHANNELS,
                {},
                this.userDid,
                this.context.getAppDid()
            ) as any
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
            let runner = await this.context.getScriptRunner(this.userDid)
            let result = await runner.callScript(
                scripts.SCRIPT_PRIFILE_CHANNELS,
                {},
                this.userDid,
                this.context.getAppDid()
            ) as any
            logger.debug(`Call script to query owned channels: ${result}`);

            let items = result.find_message.items
            let channelInfos = []
            items.forEach((item: any) => {
                channelInfos.push(ChannelInfo.parse(this.userDid, item))
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
            let runner = await this.context.getScriptRunner(this.userDid)
            let result = await runner.callScript(
                scripts.SCRIPT_QUERY_CHANNEL_INFO,
                {"channel_id": channelId,},
                this.userDid,
                this.context.getAppDid()
            ) as any
            logger.debug(`Call script to query owned channel by id: ${result}`)

            const items = result.find_message.items
            let channelInfo =  ChannelInfo.parse(this.userDid, items[0])

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
            let runner = await this.context.getScriptRunner(this.userDid)
            let result = await runner.callScript(
                scripts.SCRIPT_PRIFILE_SUBSCRIPTIONS,
                {},
                this.userDid,
                this.context.getAppDid()
            ) as any
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
            let runner = await this.context.getScriptRunner(this.userDid)
            let result = await runner.callScript(
                scripts.SCRIPT_PRIFILE_SUBSCRIPTIONS,
                {},
                this.userDid,
                this.context.getAppDid()
            ) as any
            logger.debug(`Call script to query subscriptions: ${result}`)

            let items = result.find_message.items
            let subscriptions = []

            for (let index = 0; index < items.length; index++) {
                let item = items[index]
                let channel_id = item.channel_id
                let target_did = item.target_did.toString()

                runner = await this.context.getScriptRunner(channel_id)
                let info = await runner.callScript(
                    scripts.SCRIPT_QUERY_CHANNEL_INFO,
                    { "channel_id": channel_id },
                    channel_id,
                    this.context.getAppDid()
                ) as any
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
        const profile = new Profile(context, targetDid, displayName)

        return profile
    }
}
