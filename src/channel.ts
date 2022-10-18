import { Logger } from './utils/logger'
import { ChannelInfo } from './channelinfo'
import { Dispatcher } from './dispatcher'
import { ChannelHandler } from './channelhandler'
import { PostBody } from './postbody'
import { hiveService as VaultService } from "./hiveService"
import { Profile } from './profile'
import { RuntimeContext } from './runtimecontext'
import { ScriptingNames as scripts } from './vault/constants'
import { CommentInfo } from './commentInfo'

const logger = new Logger("Channel")
/**
 * This class represent the channel owned by others. Users can only read posts
 * from this channel.
 */
class Channel implements ChannelHandler {
    private context: RuntimeContext;
    private channelInfo: ChannelInfo;
    private vault: VaultService

    public constructor(channelInfo: ChannelInfo) {
        this.channelInfo = channelInfo;
        this.vault = new VaultService()
        this.context = RuntimeContext.getInstance()
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
            const channelId = this.getChannelInfo().getChannelId()
            const params = {
                "channel_id": channelId
            }
            logger.debug("query channel information params: ", params)
            const result = await this.vault.callScript(scripts.SCRIPT_QUERY_CHANNEL_INFO, params,
                this.getChannelInfo().getOwnerDid(), this.context.getAppDid())
                logger.debug("query channel information success: ", result)
            return ChannelInfo.parse(this.getChannelInfo().getOwnerDid(), result.find_message.items[0])
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
            const params = {
                "channel_id": this.channelInfo.getChannelId(),
                "limit": upperLimit,
                "end": earilerThan, 
            }
            logger.debug("query posts params: ", params)
            const result = await this.vault.callScript(scripts.SCRIPT_CHANNEL_POST_BY_END_TIME_AND_LIMIT, params,
                this.getChannelInfo().getOwnerDid(), this.context.getAppDid())
            logger.debug("query posts success: ", result)
            let targetDid = this.getChannelInfo().getOwnerDid()
            let posts = []
            result.find_message.items.forEach(item => {
                const post = PostBody.parse(targetDid, item)
                posts.push(post)
            })
            logger.debug("query posts 'postBodys': ", posts)
            return posts
        } catch (error) {
            logger.error('Query posts error:', error)
            throw new Error(error)
        }
    }

    /**
     * Query the list of Posts from this channel by a speific range of time.
     *
     * @param start The beginning timestamp
     * @param end The end timestamp
     * @returns An promise object that contains a list of posts.
     */
    public async queryPostsByRangeOfTime(start: number, end: number): Promise<PostBody[]> {
        try {
            const params = {
                "channel_id": this.channelInfo.getChannelId(),
                "start": start,
                "end": end
            }
            logger.debug("query posts by range of time params: ", params)

            const result = await this.vault.callScript(scripts.QUERY_PUBLIC_SOMETIME_POST, params,
                this.channelInfo.getOwnerDid(), this.context.getAppDid())
            logger.debug("query posts by range of time success: ", result)
            const targetDid = this.channelInfo.getOwnerDid()
            let posts = []
            result.find_message.items.forEach(item => {
                const post = PostBody.parse(targetDid, item)
                posts.push(post)
            })
            logger.debug("query posts by range of time 'postBodys': ", posts)
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
            const params = {
                "channel_id": this.getChannelInfo().getChannelId(),
                "post_id": postId
            }
        logger.debug("query post params: ", params)
            const results = await this.vault.callScript(scripts.QUERY_PUBLIC_SPECIFIED_POST, params,
                this.channelInfo.getOwnerDid(), this.context.getAppDid())
            const result = results.find_message.items
            logger.debug("query post success: ", result)
            let posts = []
            for (let index = 0; index < result.length; index++) {
                const item = result[index]
                const post = PostBody.parse(this.getChannelInfo().getOwnerDid(), item)
                posts.push(post)
            }
            logger.debug("query post 'postBody': ", posts)
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
            const params = {
                "channel_id": this.getChannelInfo().getChannelId(),
                "status": 0
            }
            logger.debug("query subscriber count params: ", params)
            const results = await this.vault.callScript(scripts.SCRIPT_QUERY_SUBSCRIPTION_BY_CHANNELID, params,
                this.channelInfo.getOwnerDid(), this.context.getAppDid())
            logger.debug("query subscriber count success: ", results)

            return results.find_message.items.length
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
            const params = {
                "channel_id": this.getChannelInfo().getChannelId(),
                "limit": upperLimit,
                "end": earilerThan,
            }
            logger.debug("query subscriber count params: ", params)
    
            const results = await this.vault.callScript(scripts.SCRIPT_CHANNEL_SUBSCRIBERS, params,
                this.channelInfo.getOwnerDid(), this.context.getAppDid())
            logger.debug("query subscriber count success: ", results)
            const result = results.find_message.items
            let profiles = []
            for (let index = 0; index < result.length; index++) {
                const item = result[index]
                const profile = Profile.parse(this.context, this.getChannelInfo().getOwnerDid(), item)
                profiles.push(profile)
            }
            logger.debug("query subscriber count 'profiles': ", profiles)
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
    public async queryPostByChannelId(): Promise<PostBody[]> {
        try {
            const params = {
                "channel_id": this.getChannelInfo().getChannelId(),
            }
            logger.debug("query post by channel id params: ", params)
            const results = await this.vault.callScript(scripts.SCRIPT_QUERY_POST_BY_CHANNEL, params,
                this.getChannelInfo().getOwnerDid(), this.context.getAppDid())
            logger.debug("query post by channel id success: ", results)
            const result = results.find_message.items
            let posts = []
            result.forEach(item => {
                const post = PostBody.parse(this.getChannelInfo().getOwnerDid(), item)
                posts.push(post)
            })
            logger.debug("query post by channel id 'postBodys': ", posts)
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
            const params = {
                "channel_id": this.getChannelInfo().getChannelId(),
            }
            logger.debug("query comment by channel params: ", params)
            const results = await this.vault.callScript(scripts.SCRIPT_QUERY_COMMENT_BY_CHANNELID, params,
                this.getChannelInfo().getOwnerDid(), this.context.getAppDid())
            logger.debug("query comment by channel success: ", results)
            const result = results.find_message.items
            let comments = []
            result.forEach(item => {
                const comment = CommentInfo.parse(this.getChannelInfo().getOwnerDid(), item)
                comments.push(comment)
            })
            logger.debug("query comment by channel 'commentInfo': ", comments)
            return comments
        } catch (error) {
            logger.error('query comment by channel error:', error)
            throw new Error(error);
        }
    }

    static parse(targetDid: string, item: any): Channel {
        const channelInfo = ChannelInfo.parse(targetDid, item)
        const channel = new Channel(channelInfo)
        return channel
    }
}

export {
    Channel,
}
