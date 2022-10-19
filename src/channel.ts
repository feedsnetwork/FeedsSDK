import { Logger } from './utils/logger'
import { ChannelInfo } from './channelinfo'
import { ChannelHandler } from './channelhandler'
import { PostBody } from './postbody'
import { Profile } from './profile'
import { RuntimeContext } from './runtimecontext'
import { CommentInfo } from './commentInfo'
import { ScriptingNames as scripts } from './vault/constants'
import { ScriptingService as ScriptRunner } from "./vault/scriptingservice";

const logger = new Logger("Channel")
    /**
    * This class represent the channel owned by others. Users can only read posts
    * from this channel.
    */
class Channel implements ChannelHandler {
    private context: RuntimeContext;
    private channelInfo: ChannelInfo;
    private scriptingService: ScriptRunner;

    public constructor(appContext: RuntimeContext, channelInfo: ChannelInfo) {
        this.context = appContext
        this.channelInfo = channelInfo
        this.scriptingService = new ScriptRunner(appContext);
    }

    /**
     * Get channel information from local storage.
     * @returns The channel information
     */
    public getChannelInfo(): ChannelInfo {
        return this.channelInfo;
    }

    /**
     * Query the channel infomation from remote channel on Vault.
     * @returns An promise object that contains channel information.
     */
    public async queryChannelInfo(): Promise<ChannelInfo> {
        try {
            let result = await this.scriptingService.callScript(
                scripts.SCRIPT_QUERY_CHANNEL_INFO,
                { "channel_id": this.getChannelInfo().getChannelId() },
                this.getChannelInfo().getOwnerDid(),
                this.context.getAppDid()
            )
            logger.debug(`Call script to query channel info: ${result}`);

            let channelInfo = ChannelInfo.parse(
                this.getChannelInfo().getOwnerDid(),
                result.find_message.items[0]
            )
            logger.debug(`Got this channel information: ${channelInfo}`);
            return channelInfo;

        } catch (error) {
            logger.error('Query channel information error: ', error)
            throw new Error(error)
        }
    }

    /**
     * // 新增
     * fetch a list of Posts with timestamps that are earlier than specific timestamp
     * and limited number of this list too.
     *
     * @param earilerThan The timestamp than which the posts to be fetched should be
     *                    earlier
     * @param upperLimit The max limit of the posts in this transaction.
     * @returns An promise object that contains a list of posts.
     */
    public async queryPosts(earilerThan: number, upperLimit: number): Promise<PostBody[]> {
        try {
            let params = {
                "channel_id": this.channelInfo.getChannelId(),
                "limit": upperLimit,
                "end": earilerThan,
            }
            let result = await this.scriptingService.callScript(
                scripts.SCRIPT_CHANNEL_POST_BY_END_TIME_AND_LIMIT,
                params,
                this.getChannelInfo().getOwnerDid(),
                this.context.getAppDid()
            )
            logger.debug(`Call script to query posts: ${result}`);

            let targetDid = this.getChannelInfo().getOwnerDid()
            let posts = []
            result.find_message.items.forEach((item: any) => {
                posts.push(PostBody.parse(targetDid, item))
            })
            logger.debug(`Got posts: ${posts}`);
            return posts
        } catch (error) {
            logger.error('Query posts error:', error)
            throw new Error(error)
        }
    }

    /**
     * Query the list of Posts from this channel by a speific range of time.
     *
     * Return up to 30
     * @param start The beginning timestamp
     * @param end The end timestamp
     * @returns An promise object that contains a list of posts.
     */
    public async queryPostsByRangeOfTime(start: number, end: number): Promise<PostBody[]> {
        try {
            let params = {
                "channel_id": this.channelInfo.getChannelId(),
                "start": start,
                "end": end
            }
            let result = await this.scriptingService.callScript(
                scripts.QUERY_PUBLIC_SOMETIME_POST,
                params,
                this.channelInfo.getOwnerDid(),
                this.context.getAppDid()
            )
            logger.debug(`Call script to query posts by range of time: ${result}`);

            let targetDid = this.channelInfo.getOwnerDid()
            let posts = []
            result.find_message.items.forEach((item: any) => {
                posts.push(PostBody.parse(targetDid, item))
            })
            logger.debug(`Got posts by range of time: ${posts}`)
            return posts
        } catch (error) {
            logger.error("Query posts error: ", error)
            throw new Error(error)
        }
    }

    /**
     * Query a post by post identifier.
     *
     * @param postId The post id
     * @returns An promise object that contains the post.
     */
    public async queryPost(postId: string): Promise<PostBody> {
        try {
            let params = {
                "channel_id": this.getChannelInfo().getChannelId(),
                "post_id": postId
            }

            let result = await this.scriptingService.callScript(
                scripts.QUERY_PUBLIC_SPECIFIED_POST,
                params,
                this.channelInfo.getOwnerDid(),
                this.context.getAppDid()
            )
            logger.debug(`Call script to query specified post: ${result}`);

            let items = result.find_message.items
            let posts = []
            for (let index = 0; index < items.length; index++) {
                const item = items[index]
                const post = PostBody.parse(this.getChannelInfo().getOwnerDid(), item)
                posts.push(post)
            }
            logger.log(`Got post with postId ${postId}: ${posts[0]}`)
            return posts[0]
        }
        catch (error) {
            logger.error("Query post error:", error)
            throw new Error(error)
        }
    }

    /**
     * Query the subscriber count of this channel.
     * @returns An promise object that contains the number of subscribers to this channel.
     */
    public async querySubscriberCount(): Promise<number> {
        try {
            let params = {
                "channel_id": this.getChannelInfo().getChannelId(),
                "status": 0
            }
            let result = await this.scriptingService.callScript(
                scripts.SCRIPT_QUERY_SUBSCRIPTION_BY_CHANNELID,
                params,
                this.channelInfo.getOwnerDid(),
                this.context.getAppDid()
            )
            logger.debug(`Call script to query subscriber count: ${result}`)

            let count = result.find_message.total;
            logger.log(`Got subscriber count: ${count}`)
            return count
        } catch (error) {
            logger.error("Query subscriber count: ", error)
            throw new Error(error)
        }
    }

    /**
     * 新增：
     * Query the list of subscribers to this channel.
     *
     * @param earilerThan The timestamp
     * @param upperlimit The maximum number of subscribers for this query.
     */
    public async querySubscribers(earilerThan: number, upperLimit: number): Promise<Profile[]> {
        try {
            let params = {
                "channel_id": this.getChannelInfo().getChannelId(),
                "limit": upperLimit,
                "end": earilerThan,
            }
            let result = await this.scriptingService.callScript(
                scripts.SCRIPT_CHANNEL_SUBSCRIBERS,
                params,
                this.channelInfo.getOwnerDid(),
                this.context.getAppDid()
            )
            logger.debug(`Call script to query subscribers: ${result}`)

            let items = result.find_message.items
            let profiles = []
            for (let index = 0; index < items.length; index++) {
                let profile = Profile.parse(
                    this.context,
                    this.getChannelInfo().getOwnerDid(),
                    items[index]
                )
                profiles.push(profile)
            }
            logger.debug(`Got subscribers: ${profiles}`)
            return profiles
        } catch (error) {
            logger.error("Query ubscribers error : ", error)
            throw new Error(error)
        }
    }

    /**
    * Subscription required to call， 同步feeds api
    *
    * @returns Query all post information under the specified channelId
    */
    public async queryPostsByChannel(): Promise<PostBody[]> {
        try {
            let params = {
                "channel_id": this.getChannelInfo().getChannelId(),
            }
            let result = await this.scriptingService.callScript(
                scripts.SCRIPT_QUERY_POST_BY_CHANNEL,
                 params,
                this.getChannelInfo().getOwnerDid(),
                this.context.getAppDid()
            )
            logger.debug(`Call script to query posts by channelId: ${result}`)

            let items = result.find_message.items
            let posts = []
            items.forEach((item: any) => {
                posts.push(PostBody.parse(this.getChannelInfo().getOwnerDid(), item))
            })
            logger.debug(`Got posts by channelId: ${posts}`)
            return posts
        } catch (error) {
            logger.error('Query post by channelId error:', error)
            throw new Error(error)
        }
    }

    /** Subscription required to call
    * 需订阅才能调用 同步feeds api
    * @returns Query all comment information under the specified channelId
    */
    public async queryCommentByChannel(): Promise<CommentInfo[]> {
        try {
            let params = {
                "channel_id": this.getChannelInfo().getChannelId(),
            }
            let result = await this.scriptingService.callScript(
                scripts.SCRIPT_QUERY_COMMENT_BY_CHANNELID,
                params,
                this.getChannelInfo().getOwnerDid(),
                this.context.getAppDid()
            )
            logger.debug(`Call script to query comment by channel: ${result}`)

            let items = result.find_message.items
            let comments = []
            result.forEach((item: any) => {
                comments.push(CommentInfo.parse(this.getChannelInfo().getOwnerDid(), item))
            })
            logger.debug(`Got comments by channel: ${comments}`)
            return comments
        } catch (error) {
            logger.error('query comment by channel error:', error)
            throw new Error(error);
        }
    }

    static parse(targetDid: string, item: any): Channel {
        const channelInfo = ChannelInfo.parse(targetDid, item)
        const channel = new Channel(RuntimeContext.getInstance(), channelInfo)
        return channel
    }
}

export {
    Channel,
}
