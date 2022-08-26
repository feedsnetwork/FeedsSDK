import { Logger } from './utils/logger'
import { Dispatcher } from './Dispatcher'
import { ChannelInfo } from './ChannelInfo'
import { ChannelHandler } from "./ChannelHandler"
import { Post } from './Post';
import { ChannelInfoFetcher } from './ChannelInfoFetcher';

//const logger = new Logger("MyChannel")

export class MyChannel implements ChannelInfoFetcher {
    private channelInfo: ChannelInfo;
    private published: boolean;

    private constructor(channel: ChannelInfo) {
        this.channelInfo = channel;
    }

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
        throw new Error('Method not implemented.');
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
        throw new Error('Method not implemented.');
        // TODO:
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
        throw new Error('Method not implemented.');
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
        throw new Error('Method not implemented.');
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
        throw new Error('Method not implemented.');
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
        throw new Error('Method not implemented.');
        // TODO:
    }

    /**
     *
     * @param postId
     */
    public deletePost(postId: string): Promise<boolean> {
        throw new Error('Method not implemented.');
        // TODO:
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

}

