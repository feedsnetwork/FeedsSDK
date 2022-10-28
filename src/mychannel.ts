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
            let result = await db.findOne(collections.CHANNELS,
                { "channel_id": this.getChannelId() }
            )
            logger.debug(`Call script to query channel info: ${result}`)

            return deserializeToChannelInfo(
                this.getOwnerDid(),
                result
            )
        } catch (error) {
            throw new Error(`Query channnel info with channelId: ${this.getChannelId()} error: ${error}`)
        }
    }

    public async downloadChannelAvatar(hiveUrl: string) {
        try {
            logger.debug(`Try to download channel avatar by hive url: ${hiveUrl}`)
            let fileService = await this.getFilesService()
            return await fileService.download(hiveUrl.split("@")[1])
        } catch (error) {
            throw new Error(`Download channel avatar by url ${hiveUrl} error: ${error}`)
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
            throw new Error(`Update channel error ${error}`)
        }
    }

     /**
     * Query the list of Posts from this channel by a speific range of time.
     *
     * @param startTime The beginning timestamp
     * @param endTime The end timestamp
     * @returns An promise object that contains a list of posts.
     */
    public async queryPosts(startTime: number, endTime: number, capcity: number): Promise<PostBody[]> {
        try {
            let filter = {
                "channel_id": this.getChannelId(),
                "updated_at": { $gt: startTime, $lt: endTime }
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
            throw new Error(`Query posts error: ${error}`)
        }
    }

    /**
     * Query post information by specifying postid
     * @param postId：specify postid
     */
    public async queryPostById(postId: string): Promise<PostBody> {
        try {
            let filter = {
                "channel_id": this.getChannelId(),
                "post_id": postId
            }

            let db = await this.getDatabaseService()
            let result = await db.findOne(collections.POSTS, filter)
            logger.debug(`Call script to query post by postId ${postId}: ${result}`)
            const post = PostBody.parseFrom(this.getOwnerDid(), result)
            logger.debug(`Got post with postId ${postId}: ${post}`)
            return post
        } catch (error) {
            throw new Error(`Query specific post by postId ${postId} error: ${error}`)
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
            let result = await db.countDocuments(collections.SUBSCRIPTION, filter)
            logger.debug(`Got subscriber count: ${result}`)
            return result
        } catch (error) {
            throw new Error(`Query subscriber count error: ${error}`)
        }
    }

    /**
     * Query subscribed channels
     * @param _startTime end time
     * @param endTime
     * @param capacity number of returns
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
            throw new Error(`Query subscribers error: ${error}`)
        }
    }

    /**
     * send post
     * @param postBody： post information
     */
    public async post(postBody: PostBody) {
        try {
            let doc = {
                "channel_id": postBody.getChannelId(),
                "post_id"   : postBody.getPostId(),
                "created_at": postBody.getCreatedAt(),
                "updated_at": postBody.getUpdatedAt(),
                "content"   : postBody.getContent().toString(),
                "status"    : postBody.getStatus(),
                "memo"      : postBody.getMemo(),
                "type"      : postBody.getType(),
                "tag"       : postBody.getTag(),
                "proof"     : postBody.getProof()
            }

            let db = await this.getDatabaseService()
            await db.insertOne(collections.POSTS, doc)
        } catch (error) {
            throw new Error(`Making post error: ${error}`)
        }
    }

    public updatePost(postId: string, post: PostBody) {
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
            throw new Error(`Delete specific post error: ${error}`)
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
