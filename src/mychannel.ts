import { Logger } from './utils/logger'
import { ChannelInfo, deserializeToChannelInfo } from './channelinfo'
import { Post } from './post';
import { PostBody } from './postbody';
import { Profile } from './profile';
import { RuntimeContext } from './runtimecontext';
import { CollectionNames as collections } from './vault/constants';
import { UpdateOptions, FindOptions, DatabaseService, FilesService} from "@elastosfoundation/hive-js-sdk"
import { deserializeToUserInfo, UserInfo } from './userinfo';

const logger = new Logger("MyChannel")

export class MyChannel {
    private context: RuntimeContext;
    private channelInfo: ChannelInfo;

    /**
    *
    * @param context: RuntimeContext instance
    * @param channelInfo: ChannelInfo
    */
    public constructor(context: RuntimeContext, channelInfo: ChannelInfo) {
        this.context = context
        this.channelInfo = channelInfo
    }

    public getChannelInfo(): ChannelInfo {
        return this.channelInfo
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

    private async getDatabaseService(): Promise<DatabaseService> {
        return (await this.context.getVault()).getDatabaseService()
    }

    private async getFilesService(): Promise<FilesService> {
        return (await this.context.getVault()).getFilesService()
    }

    /**
     * Fetch channel property information from remote chanenl.
     * @returns The promise object containing the channel information
     */
    public async queryChannelInfo(): Promise<ChannelInfo> {
        try {
            let db = await this.getDatabaseService()
            let result = await db.findMany( collections.CHANNELS,  // TODO: replace with countDocuments
                { "channel_id": this.getChannelId() }
            )
            logger.debug(`Call script to query channel info: ${result}`)

            return deserializeToChannelInfo(
                this.getOwnerDid(),
                result[0]
            )
        } catch (error) {
            logger.error('Query channel information error: ', error)
            throw error
        }
    }

    /**
     *  Update channel property information on remote vault.
     * @param channelInfo new channel information to be updated.
     * @returns The promise of whether updated in success or failure
     */
    public async updateChannelInfo(newChannelInfo: ChannelInfo) {
        if (newChannelInfo.getChannelId() != this.getChannelId() ||
            newChannelInfo.getOwnerDid() != this.getOwnerDid()) {
            throw new Error("Try to update different channel, aborted!!!");
        }

        try {
            let filter = {
                "channel_id": this.getChannelId(),
            }
            let doc = {
                "display_name"  : newChannelInfo.getDisplayName(),
                "tipping_address": newChannelInfo.getPaymentAddress(),
                "intro"     : newChannelInfo.getDescription(),
                "avatar"    : newChannelInfo.getAvatar(),
                "updated_at": newChannelInfo.getUpdatedAt(),
                "type"      : "",
                "nft"       : "",
                "memo"      : "",
            }
            let update = { "$set": doc }

            let db = await this.getDatabaseService()
            await db.updateOne(collections.CHANNELS, filter, update,
                new UpdateOptions(false, true)
            )
            logger.debug("Updating channel collection succeeded")
            this.channelInfo = newChannelInfo
        } catch (error) {
            logger.error('update channel information error', error)
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
    public async queryPosts(start: number, end: number, capcity: number): Promise<PostBody[]> {
        try {
            let filter = {
                "channel_id": this.getChannelId(),
                "updated_at": { $gt: start, $lt: end }
            }
            let queryOptions = new FindOptions()
            queryOptions.limit = capcity

            let db = await this.getDatabaseService()
            let result = await db.findMany(collections.POSTS, filter, queryOptions)
            logger.debug(`Call script to query posts by range of Time: ${result}`)

            let posts = []
            result.forEach(item => {
                posts.push(PostBody.parseFrom(this.getOwnerDid(), item))
            })
            logger.debug(`Got posts by range of time: ${posts}`)
            return posts
        } catch (error) {
            logger.error("Query posts by range of time error:", error)
            throw error
        }
    }

    /**
     * Query post information by specifying postid
     * @param postId：specify postid
     */
    public async queryPostById(postId: string): Promise<PostBody> {  // TODO: should not receive an arry of data.
        try {
            let filter = {
                "channel_id": this.getChannelId(),
                "post_id": postId
            }

            let db = await this.getDatabaseService()
            let result = await db.findMany(collections.POSTS,filter)
            logger.debug(`Call script to query post by postId ${postId}: ${result}`)
            let posts = []
            result.forEach(item => {
                posts.push(PostBody.parseFrom(this.getOwnerDid(), item))
            })
            logger.debug(`Got post with postId ${postId}: ${posts[0]}`)
            return posts[0]
        } catch (error) {
            logger.error("Query post error:", error)
            throw error
        }
    }

    /**
     * Query subscribed channels
     * @returns subscribed channel
     */
    public async querySubscriberCount(): Promise<number> {
        try {
            let filter = {
                "channel_id": this.getChannelId()
            }

            let db = await this.getDatabaseService()
            let result = await db.findMany(collections.SUBSCRIPTION, filter) // TODO: replace with countDocuments
            logger.debug(`Got subscriber count: ${result.length}`)
            return result.length
        } catch (error) {
            logger.error("Query subscriber count error: ", error)
            throw error
        }
    }

    /**
     * Query subscribed channels
     * @param earilerThan： end time
     * @param upperlimit：Maximum number of returns
     */
    public async querySubscribers(_startTime: number, endTime: number, capacity: number): Promise<Profile[]> {
        try {
            let filter = {
                "channel_id": this.getChannelId(),
                "updated_at": {
                    "$lt": endTime
                }
            }
            let findOptions = new FindOptions()
            findOptions.limit = capacity

            let db = await this.getDatabaseService()
            let result = await db.findMany(collections.SUBSCRIPTION, filter, findOptions)
            logger.debug(`Call script to query subscribers: ${result}`)

            let subscribers = []
            result.forEach(item => {
                subscribers.push(deserializeToUserInfo(item))
            })
            logger.debug(`Got subscribers: ${subscribers}`)
            return subscribers
        } catch (error) {
            logger.error("Query subscribers error: ", error)
            throw error
        }
    }

    /**
     * send post
     * @param postBody： post information
     */
    public async post(post: Post) {
        try {
            let body = post.getBody()
            let doc = {
                "channel_id": body.getChannelId(),
                "post_id"   : body.getPostId(),
                "created_at": body.getCreatedAt(),
                "updated_at": body.getUpdatedAt(),
                "content"   : body.getContent().toString(),
                "status"    : body.getStatus(),
                "memo"      : body.getMemo(),
                "type"      : body.getType(),
                "tag"       : body.getTag(),
                "proof"     : body.getProof()
            }

            let db = await this.getDatabaseService()
            await db.insertOne(collections.POSTS, doc)
        } catch (error) {
            logger.error('Post error: ', error)
            throw error
        }
    }

    public updatePost(postId: string, post: Post) {
        throw new Error("TODO: Not impelmented yet")
    }

    /**
     * delete post
     * @param postId： post id  // TODO: the implementation is weird, need to check it.
     */
    public async deletePost(postId: string) {
        try {
            let filter = {
                "channel_id": this.getChannelId(),
                "post_id": postId
            }
            let doc = {
                "updated_at": new Date().getTime(),
                "status": 1,
            }
            let update = { "$set": doc }

            let db = await this.getDatabaseService()
            await db.updateOne(collections.POSTS, filter, update,
                new UpdateOptions(false, true)
            )
        } catch (error) {
            logger.error("delete post error: ", error)
            throw error
        }
    }

    public async downloadChannelAvatarByUrl(url: string) {
        try {
            logger.debug("download channel avatar url: ", url)
            const params = url.split("@")
            const remoteName = params[1]
            const fileService = await this.getFilesService()
            return await fileService.download(remoteName)
        } catch (error) {
            logger.error('Download channel avatar by hive Url error:', error)
            throw error
        }
    }

    // 为了测试提供： 硬删除
    /*
    public async removePost(postId: string) {
        try {
            let filter = {
                "channel_id": this.getChannelId(),
                "post_id": postId
            }

            let db = await this.getDatabaseService()
            await db.deleteOne(collections.POSTS, filter)
            logger.debug("The post has been removed")
        } catch (error) {
            logger.error("remove post error: ", error)
            throw error
        }
    }*/
}
