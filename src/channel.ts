import { Logger } from './utils/logger'
import { Post } from './Post'
import { ChannelInfo } from './ChannelInfo'
import { Dispatcher } from './Dispatcher'
import { ChannelHandler } from './ChannelHandler'
import { PostFetcher } from './PostFetcher'

const logger = new Logger("Channel")

export class Channel implements PostFetcher {
    private readonly channelInfo: ChannelInfo;

    private constructor(channelInfo: ChannelInfo) {
        this.channelInfo = channelInfo;
    }

    /**
     * Get channel property information from local store.
     * @returns
     */
    public getChannelInfo(): ChannelInfo {
        return this.channelInfo;
    }

    /**
     * Fetch the channel infomation from remote channel.
     */
    public fetchChannelInfo(): Promise<ChannelInfo> {
        throw new Error('Method not implemented.')
    }

    /**
     *
     * @param dispatcher
     */
    public fetchAndDispatchChannelInfo(dispatcher: Dispatcher<ChannelInfo>) {
        throw new Error('Method not implemented.')
    }

    /**
     * fetch a list of posts from this subscription channel that should be earler than
     * specific time and upper limited number.
     *
     * @param earlierThan
     * @param upperNumber:
     * @returns
     */
    public fetchPosts(earlerThan: number, upperLimit: number): Promise<Post[]> {
        throw new Error('Method not implemented.')
    }

    /**
     * Fetch a list of posts from this subscription channel and dispatch a post one by one to
     * cusomtized dispatcher routine.
     *
     * @param until
     * @param upperLimit
     * @param dispatcher
     */
    public fetchAndDispatchPosts(until: number, upperLimit: number, dispatcher: Dispatcher<Post>) {
        throw new Error('Method not implemented.')
    }

    /**
     * Fetch a list of Posts with a speific range of time.
     *
     * @param start
     * @param end
     */
    public fetchPostsByRangeOfTime(start: number, end: number): Promise<Post[]> {
        throw new Error('Method not implemented.')
    }

    /**
     * Fetch a list of posts from this subscription channel and dispatch a post one by one to
     * cusomtized dispatcher routine.
     *
     * @param until
     * @param upperLimit
     * @param dispatcher
     */
    public fetchAndDispatchPostsRangeOfTime(start: number, end: number, upperLimit: number, dispatcher: Dispatcher<Post>) {
        throw new Error('Method not implemented.')
    }

    /**
     *
     * @param postId
     */
    public fetchPost(postId: string): Promise<Post> {
        throw new Error('Method not implemented.')
    }

    /**
     *
     * @param postId
     * @param dispatcher
     */
    public fetchAndDispatchPost(postId: string, dispatcher: Dispatcher<Post>) {
        throw new Error('Method not implemented.')
    }

    /**
     *
     */
    public fetchNumberOfSubscribers(): Promise<number> {
        throw new Error('Method not implemented.')
    }

    /**
     *
     * @param until
     * @param upperLimit
     * @param dispatcher
     */
    public fetchAndDispatchSubscribers(until: number, upperLimit: number, dispatcher: Dispatcher<Subscriber>) {
        throw new Error('Method not implemented.')
    }
}
