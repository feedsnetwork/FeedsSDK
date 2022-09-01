import { Logger } from './utils/logger'
import { Dispatcher } from './Dispatcher'
import { ChannelInfo } from './ChannelInfo'
import { ChannelHandler } from "./ChannelHandler"
import { Post } from './Post';
import { ChannelInfoFetcher } from './ChannelInfoFetcher';
import { config } from "./config"
import { hiveService } from "./hiveService"
import { UpdateOptions } from "@elastosfoundation/hive-js-sdk"
import { Channel } from './Channel';

const logger = new Logger("MyChannel")

export class MyChannel extends Channel implements ChannelInfoFetcher {
   // private channelInfo: ChannelInfo;
    private published: boolean;
    private hiveservice: hiveService

    /*private constructor(channel: ChannelInfo) {
        this.channelInfo = channel;
    }*/

    /**
     * Check whether this channel is published on the registry contract or not.
     * @returns The boolean state of being published or not.
     */
    public isPublic(): boolean {
        return this.published;
    }

    /**
     * Get channel information from local store.
     * @returns channel information object.
     */
    public getChannelInfo(): ChannelInfo {
        return this.channelInfo;
    }

    /**
     * Fetch channel property information from remote chanenl.
     * @returns The promise object containing the channel information
     */
    public fetchChannelInfo(): Promise<ChannelInfo> {
        return new Promise(async (resolve, reject) => {
            try {
                const params = {
                    "channel_id": this.channelInfo.getChannelId(),
                }
                const appid = config.ApplicationDID // todo
                let result = await this.hiveservice.callScript(config.SCRIPT_QUERY_CHANNEL_INFO, params, this.channelInfo.getOwnerDid(), appid, this.channelInfo.getOwnerDid())
                logger.log('fetch channel info success: ', result)
                const channelInfo = ChannelInfo.parse(this.channelInfo.getOwnerDid(), result)
                resolve(channelInfo)
            } catch (error) {
                logger.log('fetch channel info error: ', error)
                reject(error)
            }
        })
    }

     /**
      * Fetch channel property information and send it to dispatcher routine.
      *
      * @param dispatcher the dispatch routine to deal with channel infomration;
      */
    public fetchAndDispatchChannelInfo(dispatcher: Dispatcher<ChannelInfo>) {
        // TODO;
    }

    /**
     *  Update channel property information on remote vault.
     * @param channelInfo new channel information to be updated.
     * @returns The promise of whether updated in success or failure
     */
    public updateChannelInfo(channelInfo: ChannelInfo): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            try {
                const doc =
                {
                    "name": channelInfo.getName(),
                    "intro": channelInfo.getDescription(),
                    "avatar": channelInfo.getAvatar(),
                    "updated_at": channelInfo.getUpdatedAt(),
                    "type": channelInfo.getType(),
                    "tipping_address": channelInfo.getReceivingAddress(),
                    "nft": channelInfo.getNft(),
                    "memo": channelInfo.getMmemo(),
                }
                const option = new UpdateOptions(false, true)
                let filter = { "channel_id": channelInfo.getChannelId() }
                let update = { "$set": doc }

                const updateResult = this.hiveservice.updateOneDBData(config.TABLE_CHANNELS, filter, update, option)
                logger.trace('update channel success: ', updateResult)
                resolve(true)
            } catch (error) {
                logger.error('update channel error', error)
                reject(error)
            }
        })
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
    public fetchPosts(earilerThan: number, upperLimit: number): Promise<Post[]> {
        return new Promise(async (resolve, reject) => {
            try {
                let userDid = this.channelInfo.getOwnerDid()
                const filter = { "limit": { "$lt": upperLimit }, "created": { "$gt": earilerThan } }
                const result = await this.hiveservice.queryDBData(config.SCRIPT_SOMETIME_POST, filter)
                // const params = { "channel_id": this.channelInfo.getChannelId(), "start": earilerThan, "limit": { "$lt": upperLimit } }
                // result.find_message.items
                let posts = []
                result.forEach(item => {
                    const post = Post.parse(userDid, item)
                    posts.push(post)
                })
                logger.log('Fetch posts success, result is', result)
                resolve(posts)
            } catch (error) {
                logger.error('Fetch posts error:', error)
                reject(error)
            }
        })
    }

    /**
     *
     * @param until
     * @param upperLimit
     * @param dispatcher
     */
    public fetchAndDispatchPosts(until: number, upperLimit: number, dispatcher: Dispatcher<Post>) {
        throw new Error('Method not implemented.');
    }

    /**
     *
     * @param start
     * @param end
     */
    public fetchPostsByRangeOfTime(start: number, end: number): Promise<Post[]> {
        return new Promise(async (resolve, reject) => {
            try {
                const channelId = this.channelInfo.getChannelId()
                const filter = { "channel_id": channelId, "created": { $gt: start, $lt: end } }
                const result = await this.hiveservice.queryDBData(config.SCRIPT_SOMETIME_POST, filter)
                // const filter = { created: { "$gt": start }, end: { "$gt": end } }
                // const result = await this.hiveservice.queryDBData(config.TABLE_POSTS, filter)
                let posts = []
                result.forEach(item => {
                    const post = Post.parse(this.channelInfo.getOwnerDid(), item)
                    posts.push(post)
                })
                resolve(posts)
            } catch (error) {
                logger.error('Call script error:', error)
                reject(error)
            }
        })
    }

    /**
     *
     * @param start
     * @param end
     * @param upperLimit
     * @param dispatcher
     */
    public fetchAndDispatchPostsRangeOfTime(start: number, end: number, upperLimit: number, dispatcher: Dispatcher<Post>) {
        throw new Error('Method not implemented.');
    }

    /**
     *
     * @param postId
     */
    public fetchPost(postId: string): Promise<Post> {
        return new Promise(async (resolve, reject) => {
            try {
                const channelId = this.channelInfo.getChannelId()
                const filter = { "channel_id": channelId, "postId": postId }
                const result = await this.hiveservice.queryDBData(config.SCRIPT_SOMETIME_POST, filter)
                let posts = []
                result.forEach(item => {
                    const post = Post.parse(this.channelInfo.getOwnerDid(), item)
                    posts.push(post)
                })
                resolve(posts[0])
            } catch (error) {
                logger.error('Call script error:', error)
                reject(error)
            }
        })
    }

    /**
     *
     * @param postId
     * @param dispatcher
     */
    public fetchAndDispatchPost(postId: string, dispatcher: Dispatcher<Post>) {
        throw new Error('Method not implemented.');
    }

    /**
     *
     */
    public fetchNumberOfSubscribers(): Promise<number> {
        throw new Error('Method not implemented.');
    }

    /**
     *
     * @param until
     * @param upperLimit
     * @param dispatcher
     */
    public fetchAndDispatchSubscribers(until: number, upperLimit: number, dispatcher: Dispatcher<Profile>) {
        throw new Error('Method not implemented.');
    }

    /**
     *
     * @param postBody
     */
    public post(postBody: Post): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            const postInfo = postBody.getPostChunk()
            const doc =
            {
                "channel_id": postInfo.getChannelId(),
                "post_id": postInfo.getPostId(),
                "created_at": postInfo.getCreatedAt(),
                "updated_at": postInfo.getUpdatedAt(),
                "content": postInfo.getContent().toString(),
                "status": postInfo.getStatus(),
                "memo": postInfo.getMemo(),
                "type": postInfo.getType(),
                "tag": postInfo.getTag(),
                "proof": postInfo.getProof()
            }
            try {
                resolve(true)
            } catch (error) {
                logger.error('insert post data error: ', error)
                reject(error)
            }
        })
    }

    /**
     *
     * @param postId
     */
    public deletePost(postId: string): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            const updatedAt = new Date().getTime()
            const channelId = this.channelInfo.getChannelId()
            const doc =
            {
                "updated_at": updatedAt,
                "status": 1,
            }
            const option = new UpdateOptions(false, true)
            let filter = { "channel_id": channelId, "post_id": postId }
            let update = { "$set": doc }
            try {
                const result = await this.hiveservice.updateOneDBData(config.TABLE_POSTS, filter, update, option)
                logger.log('Delete post success: ', result)
                resolve(true)
            } catch (error) {
                logger.error('Delete data from postDB error: ', error)
                reject(error)
            }
        })
    }

    static parse(targetDid: string, channels: any): MyChannel[] {
        let parseResult = []
        channels.forEach(item => {
            const channelInfo = ChannelInfo.parse(targetDid, item)
            const myChannel = new MyChannel(channelInfo)
            parseResult.push(myChannel)
        })

        return parseResult
    }

    static parseOne(targetDid: string, channels: any): MyChannel {
        let parseResult = []
        channels.forEach(item => {
            const channelInfo = ChannelInfo.parse(targetDid, item)
            const myChannel = new MyChannel(channelInfo)
            parseResult.push(myChannel)
        })

        return parseResult[0]
    }

}

