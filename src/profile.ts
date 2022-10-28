import { RuntimeContext } from "./runtimecontext";
import { ChannelInfo, deserializeToChannelInfo } from "./channelinfo";
import { ProfileHandler } from "./profilehandler";
import { ScriptingNames as scripts } from "./vault/constants"
import { Logger } from './utils/logger'
import { UserInfo } from "./userinfo";
import { PostBody } from "./postbody";

const logger = new Logger("Profile")

export class Profile implements ProfileHandler {
    private context: RuntimeContext;
    private userDid: string;
    private displayName: string

    /**
    * @param context: RuntimeContext instance
    */
    public constructor(context: RuntimeContext, userInfo: UserInfo) {
        this.context = context;
        this.userDid = userInfo.getUserDid()
        this.displayName = userInfo.getDisplayName()
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
            let result = await runner.callScript<any>(
                scripts.SCRIPTV1_QUERY_OWNEDCHANNELS, {},
                this.userDid,
                this.context.getAppDid()
            )
            logger.debug(`Call script to query owned channel acount: ${result}`)
            logger.debug(`Got owned channel count: ${result.find_message.total}`)

            return result.find_message.total
        } catch (error) {
            throw new Error(`Query owned channel count error: ${error}`)
        }
    }

    /**
    * Query all channels created by this profile
    */
    public async queryOwnedChannels(): Promise<ChannelInfo[]> {
        try {
            let runner = await this.context.getScriptRunner(this.userDid)
            let result = await runner.callScript<any> (
                scripts.SCRIPTV1_QUERY_OWNEDCHANNELS, {},
                this.userDid,
                this.context.getAppDid()
            )
            logger.debug(`Call script to query owned channels: ${result}`);

            let items = result.find_message.items
            let channels = []
            items.forEach((item: any) => {
                channels.push(deserializeToChannelInfo(this.userDid, item))
            })

            logger.debug(`Got owned channels: ${channels}`);
            return channels
        } catch (error) {
            throw new Error(`Query owned all channels error ${error}`)
        }
    }

    S/**
    * Query the channel information of the specified channelid under this profile
    * @param channelId：specified channel id
    */
    public async queryOwnedChannnelById(channelId: string): Promise<ChannelInfo> {
        try {
            let runner = await this.context.getScriptRunner(this.userDid)
            let result = await runner.callScript<any>(
                scripts.SCRIPTV1_QUERY_CHANNELINFO,
                { "channel_id": channelId },
                this.userDid,
                this.context.getAppDid()
            )
            logger.debug(`Call script to query owned channel by id: ${result}`)

            let items = result.find_message.items
            return deserializeToChannelInfo(this.userDid, items[0])
        } catch (error) {
            throw new Error(`Query owned channel by channelid ${channelId} error: ${error}`)
        }
    }

    /**
     * Query the number of channels subscribed by this profile
    */
    public async querySubscribedChannelCount(): Promise<number> {
        try {
            let runner = await this.context.getScriptRunner(this.userDid)
            let result = await runner.callScript<any>(
                scripts.SCRIPT_PRIFILE_SUBSCRIPTIONS, {},
                this.userDid,
                this.context.getAppDid()
            )
            logger.debug(`Call script to subscription count: ${result}`)
            logger.debug(`Got subscription count: ${result.find_message.total}`)

            return result.find_message.total
        } catch (error) {
            throw new Error(`Query subscribed channel count error: ${error}`)
        }
    }

    public async querySubscribedChannels(): Promise<ChannelInfo[]> {
        return await this._querySubscribedChannels(0, Date.now(), 30)
    }

    /**
    * Query the channels subscribed to by this profile
    */
    public async _querySubscribedChannels(_start: number, _end: number, _capacity: number): Promise<ChannelInfo[]> {
        try {
            let runner = await this.context.getScriptRunner(this.userDid)
            let result = await runner.callScript<any> (
                scripts.SCRIPT_PRIFILE_SUBSCRIPTIONS, {},
                this.userDid,
                this.context.getAppDid()
            )
            logger.debug(`Call script to query subscriptions: ${result}`)

            let items = result.find_message.items
            let channels = []

            for (let index = 0; index < items.length; index++) {
                let item = items[index]
                let channel_id = item.channel_id
                let target_did = item.target_did

                runner = await this.context.getScriptRunner(channel_id)
                let info = await runner.callScript<any>(
                    scripts.SCRIPTV1_QUERY_CHANNELINFO,
                    { "channel_id": channel_id },
                    channel_id,
                    this.context.getAppDid()
                )
                channels.push(deserializeToChannelInfo(target_did, info.find_message.items[0]))
            }

            logger.debug(`Got subscribed channels: ${channels}`)
            return channels
        } catch (error) {
            throw new Error(`Query subscribed channels error ${error}`)
        }
    }

    public querySubscribedChannelById(_channelId: string): Promise<ChannelInfo> {
        throw new Error("Method not implemented.");
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
}
