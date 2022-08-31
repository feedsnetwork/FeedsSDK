import { Logger } from './utils/logger'
import { Post } from './Post'
import { ChannelInfo } from './ChannelInfo'
import { Dispatcher } from './Dispatcher'
import { ChannelHandler } from './ChannelHandler'
import { PostChunk } from './PostChunk'

const logger = new Logger("Channel")

export class Channel implements ChannelHandler {
    private readonly channelInfo: ChannelInfo;

    private constructor(channelInfo: ChannelInfo) {
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
        throw new Error('Method not implemented.')
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
        throw new Error('Method not implemented.')
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
        throw new Error('Method not implemented.')
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
        throw new Error('Method not implemented.')
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

    static parse(targetDid: string, channels: any): Channel[] {
        let parseResult = []
        channels.forEach(item => {
            const channelInfo = ChannelInfo.parse(targetDid, item)
            const channel = new Channel(channelInfo)
            parseResult.push(channel)
        })

        return parseResult
    }
}
