import { Logger } from './utils/logger'
import { Post } from './Post'
import { ChannelInfo } from './ChannelInfo'
import { Dispatcher } from './Dispatcher'
import { ChannelHandler } from './ChannelHandler'
import { PostChunk } from './PostChunk'
import { config } from "./config"
import { hiveService } from "./hiveService"

const logger = new Logger("Channel")

export class Channel implements ChannelHandler {
    private readonly channelInfo: ChannelInfo;
    private hiveservice: hiveService

    protected constructor(channelInfo: ChannelInfo) {
        this.channelInfo = channelInfo;
    }

    /**
     * Get channel information from local storage.
     * @returns The channel information
     */
    public getChannelInfo(): ChannelInfo {
        return this.channelInfo;
    }

    /**
     * Query the channel infomation from remote channel
     * @returns An promise object that contains channel information.
     */
    public queryChannelInfo(): Promise<ChannelInfo> {
        return new Promise(async (resolve, reject) => {
            try {
                const appid = config.ApplicationDID
                const targetDid = this.channelInfo.getOwnerDid()
                const params = { "channel_id": this.channelInfo.getChannelId() }
                let result = await this.hiveservice.callScript(config.SCRIPT_QUERY_CHANNEL_INFO, params, targetDid, appid,)
                logger.log('Query channel info success: ', result)
                const channelInfo = ChannelInfo.parse(targetDid, result.find_message.items)
                resolve(channelInfo)
            } catch (error) {
                logger.error('Query channel info error:', error)
                reject(error)
            }
        })
    }

    /**
     * Query this channel information and dispatch it to a routine.
     *
     * @param dispatcher The dispatcher routine to deal with channel information
     */
    public async queryAndDispatchInfo(dispatcher: Dispatcher<ChannelInfo>) {
        throw new Error('Method not implemented.')
    }

    /**
     * Query the list of posts from this channel that are earler than specific time
     * and with limited number.
     *
     * @param earlierThan The timestamp
     * @param upperNumber The maximum number of posts in this query request
     * @returns An promise object that contains a list of posts.
     */
    public queryPosts(earlierThan: number, upperLimit: number): Promise<PostChunk[]> {
        return new Promise(async (resolve, reject) => {
            try { //TODO: 需注册新的script
                const appid = config.ApplicationDID
                const targetDid = this.channelInfo.getOwnerDid()
                const params = { "channel_id": this.channelInfo.getChannelId(), "limit": { "$lt": upperLimit }, "created": { "$gt": earlierThan } }
                let result = await this.hiveservice.callScript(config.SCRIPT_QUERY_POST_BY_CHANNEL, params, targetDid, appid)
                logger.log('query posts success: ', result)
                let posts = []
                result.find_message.items.array.forEach(item => {
                    const post = PostChunk.parse(targetDid, item)
                    posts.push(post)
                })
                resolve(posts)
            } catch (error) {
                logger.error('query posts error:', error)
                reject(error)
            }
        })
    }


    /**
     * Query the list of posts from this channel and dispatch them one by one to
     * customized dispatcher routine.
     *
     * @param earlierThan The timestamp
     * @param upperNumber The maximum number of posts in this query request.
     * @param dispatcher The dispatcher routine to deal with a post.
     */
    public async queryAndDispatchPosts(earlierThan: number,
        upperLimit: number,
        dispatcher: Dispatcher<PostChunk>) {

        throw new Error('Method not implemented.')
    }

    /**
     * Query the list of Posts from this channel by a speific range of time.
     *
     * @param start The beginning timestamp
     * @param end The end timestamp
     * @returns An promise object that contains a list of posts.
     */
    public queryPostsByRangeOfTime(start: number, end: number): Promise<PostChunk[]> {
        return new Promise(async (resolve, reject) => {
            const appid = config.ApplicationDID
            const targetDid = this.channelInfo.getOwnerDid()
            const params = { "channel_id": this.channelInfo.getChannelId(), "start": start, "end": end }
            let result = await this.hiveservice.callScript(config.SCRIPT_QUERY_POST_BY_CHANNEL, params, targetDid, appid)
            logger.log('query posts success: ', result)
            let posts = []
            result.find_message.items.array.forEach(item => {
                const post = PostChunk.parse(targetDid, item)
                posts.push(post)
            })
            resolve(posts)
        })
    }

    /**
     * Query the list of posts from this channel and dispatch them one by one to
     * customized dispatcher routine.
     *
     * @param start The begining timestamp
     * @param end The end timestamp
     * @param upperLimit The maximum number of this query
     * @param dispatcher The dispatcher routine to deal with a post
     */
    public queryAndDispatchPostsRangeOfTime(start: number,
        end: number,
        upperLimit: number,
        dispatcher: Dispatcher<PostChunk>) {

        throw new Error('Method not implemented.')
    }

    /**
     * Query a post by post identifier.
     *
     * @param postId The post id
     * @returns An promise object that contains the post.
     */
    public queryPost(postId: string): Promise<PostChunk> {
        return new Promise(async (resolve, reject) => {
            try {
                const params = { "channel_id": this.channelInfo.getChannelId(), "post_id": postId }
                const appid = config.ApplicationDID
                const targetDid = this.channelInfo.getOwnerDid()
                let result = await this.hiveservice.callScript(config.SCRIPT_SPECIFIED_POST, params, targetDid, appid)
                logger.log('Query post success: ', result)
                resolve(result)
            } catch (error) {
                logger.error('Query post error:', error)
                reject(error)
            }
        });
    }

    /**
     * Query a post and dispatch it to the routine.
     *
     * @param postId The post id
     * @param dispatcher The routine to deal with the queried post
     */
    public queryAndDispatchPost(postId: string, dispatcher: Dispatcher<PostChunk>) {
        throw new Error('Method not implemented.')
    }

    /**
     * Query the subscriber count of this channel.
     * @returns An promise object that contains the number of subscribers to this channel.
     */
    public querySubscriberCount(): Promise<number> {
        throw new Error('Method not implemented.')
    }

    /**
     * Query the list of subscribers to this channel.
     *
     * @param earilerThan The timestamp
     * @param upperlimit The maximum number of subscribers for this query.
     */
    public querySubscribers(earilerThan: number,
        upperlimit: number): Promise<Subscriber[]> {

        throw new Error("Method not implemented");
    }

    /**
     *
     * @param until
     * @param upperLimit
     * @param dispatcher
     */
    public queryAndDispatchSubscribers(earilerThan: number,
        upperLimit: number,
        dispatcher: Dispatcher<Subscriber>) {
        throw new Error('Method not implemented.')
    }

    static parse(targetDid: string, channels: Channel[]): Channel[] {
        let parseResult = []
        channels.forEach(item => {
            const channelInfo = ChannelInfo.parse(targetDid, item)
            const channel = new Channel(channelInfo)
            parseResult.push(channel)
        })

        return parseResult
    }

    static parseChannel(data: any) : Channel {
        return new Channel(data);
    }
}
