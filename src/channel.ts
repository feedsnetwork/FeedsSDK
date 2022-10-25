import { Logger } from './utils/logger'
import { ChannelInfo, deserializeToChannelInfo } from './channelinfo'
import { ChannelHandler } from './channelhandler'
import { PostBody } from './postbody'
import { RuntimeContext } from './runtimecontext'
import { CommentInfo } from './commentInfo'
import { ScriptingNames as scripts } from './vault/constants'
import { deserializeToUserInfo, UserInfo } from './userinfo'

const logger = new Logger("Channel")
/**
* This class represent the channel owned by others. Users can only read posts
* from this channel.
*/
class Channel implements ChannelHandler {
    private context: RuntimeContext;
    private channelInfo: ChannelInfo;

    public constructor(appContext: RuntimeContext, channelInfo: ChannelInfo) {
        this.context = appContext
        this.channelInfo = channelInfo
    }

    /**
     * Get channel information from local storage.
     * @returns The channel information
     */
    public getChannelInfo(): ChannelInfo {
        return this.channelInfo;
    }

    public getOwnerDid(): string {
        return this.channelInfo.getOwnerDid()
    }

    public getChannelId(): string {
        return this.channelInfo.getChannelId()
    }

    public getName(): string {
        return this.channelInfo.getName();
    }

    public getDisplayName(): string {
        return this.channelInfo.getDisplayName();
    }

    public getDescription(): string {
        return this.channelInfo.getDescription();
    }

    public getPaymentAddress(): string {
        return this.channelInfo.getPaymentAddress();
    }

    public getAvatar(): string {
        return this.channelInfo.getAvatar();
    }

    public getCategory(): string {
        return this.channelInfo.getCategory();
    }

    public getCreatedAt(): number {
        return this.channelInfo.getCreatedAt()
    }

    public getUpdatedAt(): number {
        return this.channelInfo.getUpdatedAt()
    }

    /**
     * Query the channel infomation from remote channel on Vault.
     * @returns An promise object that contains channel information.
     */
    public async queryChannelInfo(): Promise<ChannelInfo> {

        try {
            let params = {
                "channel_id": this.getChannelId()
            }
            let runner = await this.context.getScriptRunner(this.getOwnerDid())
            let result = await runner.callScript<any>(
                scripts.SCRIPT_QUERY_CHANNEL_INFO, params,
                this.getOwnerDid(),
                this.context.getAppDid()
            )
            logger.debug(`Call script to query channel info: ${result}`);

            return deserializeToChannelInfo(
                this.getOwnerDid(),
                result.find_message.items[0]
            )
        } catch (error) {
            logger.error('Query channel information error: ', error)
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

    public async queryPosts(start: number, end: number, _capcity: number): Promise<PostBody[]> {
        try {
            let params = {
                "channel_id": this.getChannelId(),
                "start": start,
                "end": end,
            }

            let runner = await this.context.getScriptRunner(this.getOwnerDid())
            let result = await runner.callScript<any>(
                scripts.QUERY_PUBLIC_SOMETIME_POST, params,
                this.getOwnerDid(),
                this.context.getAppDid()
            )
            logger.debug(`Call script to query posts by range of time: ${result}`);

            let targetDid = this.getOwnerDid()
            let posts = []
            result.find_message.items.forEach((item: any) => {
                posts.push(PostBody.parseFrom(targetDid, item))
            })
            logger.debug(`Got posts by range of time: ${posts}`)
            return posts
        } catch (error) {
            logger.error("Got posts by range of time error: ", error)
            throw new Error(error)
        }
    }

    /**
     * Query a post by post by post identifier.
     *
     * @param postId The post id
     * @returns An promise object that contains the post.
     */
    public async queryPostById(postId: string): Promise<PostBody> {
        try {
            let params = {
                "channel_id": this.getChannelId(),
                "post_id": postId
            }

            let runner = await this.context.getScriptRunner(this.getOwnerDid())
            let result = await runner.callScript<any>(
                scripts.QUERY_PUBLIC_SPECIFIED_POST, params,
                this.getOwnerDid(),
                this.context.getAppDid()
            )
            logger.debug(`Call script to query specified post: ${result}`);

            let items = result.find_message.items
            let posts = []
            for (let index = 0; index < items.length; index++) {
                const item = items[index]
                const post = PostBody.parseFrom(this.getOwnerDid(), item)
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
                "channel_id": this.getChannelId(),
                "status": 0
            }

            let runner = await this.context.getScriptRunner(this.getOwnerDid())
            let result = await runner.callScript<any>(
                scripts.SCRIPT_QUERY_SUBSCRIPTION_BY_CHANNELID,
                params,
                this.getOwnerDid(),
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
     */
    public async querySubscribers(start: number, end: number, upperLimit: number): Promise<UserInfo[]> {
        try {
            let params = {
                "channel_id": this.getChannelId(),
                "limit": upperLimit,
                "end": end,
            }

            let runner = await this.context.getScriptRunner(this.getOwnerDid())
            let result = await runner.callScript<any>(
                scripts.SCRIPT_CHANNEL_SUBSCRIBERS,
                params,
                this.getOwnerDid(),
                this.context.getAppDid()
            )
            logger.debug(`Call script to query subscribers: ${result}`)

            let items = result.find_message.items
            let subscribers: UserInfo[] = []
            for (let index = 0; index < items.length; index++) {
                subscribers.push(deserializeToUserInfo(items[index]))
            }
            logger.debug(`Got subscribers: ${subscribers}`)
            return subscribers
        } catch (error) {
            logger.error("Query ubscribers error : ", error)
            throw new Error(error)
        }
    }

    public querySubscriber(userDid: string ): Promise<UserInfo[]> {
        throw new Error("TODO: not implemneted")
    }

    /** Subscription required to call
    * 需订阅才能调用 同步feeds api
    * @returns Query all comment information under the specified channelId
    */
    public async queryComments(_start: number, _end: number, _capacity: number): Promise<CommentInfo[]> {
        try {
            let params = {
                "channel_id": this.getChannelId(),
            }

            let runner = await this.context.getScriptRunner(this.getOwnerDid())
            let result = await runner.callScript<any>(
                scripts.SCRIPT_QUERY_COMMENT_BY_CHANNELID,
                params,
                this.getOwnerDid(),
                this.context.getAppDid()
            )
            logger.debug(`Call script to query comment by channel: ${result}`)

            let items = result.find_message.items
            let comments = []
            items.forEach((item: any) => {
                comments.push(CommentInfo.parse(this.getOwnerDid(), item))
            })
            logger.debug(`Got comments by channel: ${comments}`)
            return comments
        } catch (error) {
            logger.error('query comment by channel error:', error)
            throw new Error(error);
        }
    }

    public async downloadChannelAvatarByUrl(url: string) {
        try {
            logger.debug("download media url: ", url)
            const params = url.split("@")
            const scriptName = params[0]
            const remoteName = params[1]
            let runner = await this.context.getScriptRunner(this.getOwnerDid())
            let result = await runner.callScript<any>(scriptName, { "path": remoteName }, this.getOwnerDid(), this.context.getAppDid())
            const transaction_id = result[scriptName]["transaction_id"]
            logger.debug("download media transaction_id: ", transaction_id)
            return await runner.downloadFile(transaction_id)
            // let jsonString = dataBuffer.toString()
        } catch (error) {
            logger.error('Download media by hive Url error:', error)
            throw error
        }
    }
}

export {
    Channel,
}
