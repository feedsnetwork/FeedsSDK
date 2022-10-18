import { Logger } from './utils/logger'
import { ChannelInfo } from './channelinfo'
import { Post } from './post';
import { ChannelHandler } from './channelhandler';
import { hiveService as VaultService } from "./hiveService"
import { PostBody } from './postbody';
import { Profile } from './profile';
import { RuntimeContext } from './runtimecontext';
import { CollectionNames, CollectionNames as collections, ScriptingNames as scripts } from './vault/constants';
import { UpdateOptions, FindOptions } from "@elastosfoundation/hive-js-sdk"

const logger = new Logger("MyChannel")

export class MyChannel {
    private context: RuntimeContext;
    private channelInfo: ChannelInfo;
    private vault: VaultService
    /**
    *
    * @param context: RuntimeContext instance
    * @param channelInfo: ChannelInfo
    */
    public constructor(context: RuntimeContext, channelInfo: ChannelInfo) {
        this.context = context
        this.channelInfo = channelInfo
        this.vault = new VaultService()
    }

    public getChannelInfo() {
        return this.channelInfo
    }

    /**
     * Fetch channel property information from remote chanenl.
     * @returns The promise object containing the channel information
     */
    public async queryChannelInfo(): Promise<ChannelInfo> {
        try {
            const channelId = this.channelInfo.getChannelId()
            const filter = {
                "channel_id": channelId
            }
            logger.debug("query channel information params: ", filter)
    
            const result = await this.vault.queryDBData(CollectionNames.CHANNELS, filter)
            logger.debug("query channel information success: ", result)
            return ChannelInfo.parse(this.channelInfo.getOwnerDid(), result[0])
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
    public async updateChannelInfo(channelInfo: ChannelInfo): Promise<boolean> {
        try {
            const filter = { "channel_id": channelInfo.getChannelId() }
            const doc = {
                "display_name": channelInfo.getDisplayName(),
                "intro" : channelInfo.getDescription(),
                "avatar": channelInfo.getAvatar(),
                "updated_at": channelInfo.getUpdatedAt(),
                "type"  : channelInfo.getType(),
                "tipping_address": channelInfo.getReceivingAddress(),
                "nft"   : channelInfo.getNft(),
                "memo"  : channelInfo.getMmemo(),
            }
            logger.debug("update channel information params: ", filter)
            const update = { "$set": doc }
            const result = await this.vault.updateOneDBData(collections.CHANNELS, filter, update, new UpdateOptions(false, true))
            logger.debug("update channel information success: ", result)
            return true
        } catch (error) {
            logger.error('update channel information error', error)
            throw new Error(error)
        }
    }

    /**
     * fetch a list of Posts with timestamps that are earlier than specific timestamp
     * and limited number of this list too.
     *
     * @param earilerThan The timestamp than which the posts to be fetched should be
     *                    earlier
     * @param upperLimit The max limit of the posts in this transaction.
     * @returns
     */
    public async queryPosts(earilerThan: number, upperLimit: number): Promise<PostBody[]> {
        try {
            const filter = {
                "channel_id": this.channelInfo.getChannelId(),
                "updated_at": { "$lt": earilerThan }
            }
            logger.debug("query posts params: ", filter)
            const queryOptions = new FindOptions()
            queryOptions.limit = upperLimit
            const result = await this.vault.queryDBDataWithOptions(CollectionNames.POSTS, filter, queryOptions)
            logger.debug("query posts success: ", result)
            let posts = []
                result.forEach(item => {
                    const post = PostBody.parse(this.channelInfo.getOwnerDid(), item)
                posts.push(post)
            })
            logger.debug("query posts 'postBody': ", posts)

            return posts
        } catch (error) {
            logger.error('Query posts error:', error)
            throw error
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
            const channelId = this.channelInfo.getChannelId()
            const filter = {
                "channel_id": channelId,
                "updated_at": { $gt: start, $lt: end }
            }
            logger.debug("query posts by range of time params: ", filter)
    
            const result = await this.vault.queryDBData(CollectionNames.POSTS, filter)
            logger.debug("query posts by range of time success: ", result)
            let posts = []
            result.forEach(item => {
                    const postBody = PostBody.parse(this.channelInfo.getOwnerDid(), item)
                    posts.push(postBody)
                })
            logger.debug("query posts by range of time 'postBody': ", posts)
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
    public async queryPost(postId: string): Promise<PostBody> {
        try {
            const filter = {
                "channel_id": this.channelInfo.getChannelId(),
                "post_id": postId
            }
            logger.debug("query post params: ", filter)
            const result = await this.vault.queryDBData(collections.POSTS, filter)
            logger.debug("query post success: ", result)
            let posts = []
            result.forEach(item => {
                const post = PostBody.parse(this.channelInfo.getOwnerDid(), item)
                posts.push(post)
            })
            logger.debug("query post 'PostBody': ", posts)
    
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
            const filter = {
                "channel_id": this.channelInfo.getChannelId()
            }
            logger.debug("query subscriber count params: ", filter)
            const result = await this.vault.queryDBData(collections.SUBSCRIPTION, filter)
            logger.debug("query subscriber count success: ", result)
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
    public async querySubscribers(earilerThan: number, upperlimit: number): Promise<Profile[]> {
        try {
            const filter = {
                "channel_id": this.channelInfo.getChannelId(),
                "updated_at": { "$lt": earilerThan }
            }
            logger.debug("query subscribers params: ", filter)
            const findOptions = new FindOptions()
            findOptions.limit = upperlimit
            const result = await this.vault.queryDBDataWithOptions(collections.SUBSCRIPTION, filter, findOptions)
            logger.debug("query subscribers success: ", result)
            let profiles = []
            result.forEach(item => {
                const profile = Profile.parse(this.context, this.channelInfo.getOwnerDid(), item)
                profiles.push(profile)
            })
            logger.debug("query subscribers 'Profile': ", profiles)
            return profiles
        } catch (error) {
            logger.error("Query subscribers error: ", error)
            throw error
        }
    }

    /**
     * send post
     * @param postBody： post information
     */
    public async post(post: Post): Promise<boolean> {
        try {
            const body = post.getBody()
            const doc = {
                "channel_id": body.getChannelId(),
                "post_id"   : body.getPostId(),
                "created_at": body.getCreatedAt(),
                "updated_at": body.getUpdatedAt(),
                "content": body.getContent().toString(),
                "status"    : body.getStatus(),
                "memo"  : body.getMemo(),
                "type"  : body.getType(),
                "tag"   : body.getTag(),
                "proof" : body.getProof()
            }
            logger.debug("post params: ", doc)
            const result = await this.vault.insertDBData(collections.POSTS, doc)
            logger.debug("post success: ", result)
            return true
        } catch (error) {
            logger.error('Post error: ', error)
            throw error
        }
    }

    /**
     * delete post
     * @param postId： post id
     */
    public async deletePost(postId: string): Promise<boolean> {
        try {
            const doc = {
                "updated_at": new Date().getTime(),
                "status": 1,
            }
            const filter = {
                "channel_id": this.channelInfo.getChannelId(),
                "post_id": postId
            }
            logger.debug("delete post params: ", filter)
            const update = { "$set": doc }
            const result = await this.vault.updateOneDBData(collections.POSTS, filter, update, new UpdateOptions(false, true))
            logger.debug("delete post success: ", result)
            return true
        } catch (error) {
            logger.error("delete post error: ", error)
            throw error
        }
    }

    // 为了测试提供： 硬删除
    public async removePost(postId: string): Promise<boolean> {
        try {
            const filter = {
                "channel_id": this.channelInfo.getChannelId(),
                "post_id": postId
            }
            logger.debug("remove post params: ", filter)
            const result = await this.vault.deleateOneDBData(collections.POSTS, filter)
            logger.debug("remove post success: ", result)
            return true
        } catch (error) {
            logger.error("remove post error: ", error)
            throw error
        }
    }

    static parse(targetDid: string, context: RuntimeContext, channel: any): MyChannel {
        const channelInfo = ChannelInfo.parse(targetDid, channel)
        const myChannel = new MyChannel(context, channelInfo)

        return myChannel
    }
}
