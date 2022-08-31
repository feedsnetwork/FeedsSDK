import { ChannelInfo } from "./ChannelInfo"
import { Dispatcher } from "./Dispatcher"
import { PostChunk } from "./PostChunk"

export interface ChannelHandler {
    /**
     * Query the channel infomation from remote channel
     * @returns An promise object that contains channel information.
     */
    queryChannelInfo(): Promise<ChannelInfo>;

    /**
     * Query the channel infomation from remote channel
     * @returns An promise object that contains channel information.
     */
    queryAndDispatchInfo(dispatcher: Dispatcher<ChannelInfo>);

    /**
     *
     * @param earlierThan
     * @param maximum
     */
     queryPosts(earlierThan: number, maximum: number): Promise<PostChunk[]>;

    /**
     * Query the list of posts from this channel and dispatch them one by one to
     * customized dispatcher routine.
     *
     * @param earlierThan The timestamp
     * @param upperNumber The maximum number of posts in this query request.
     * @param dispatcher The dispatcher routine to deal with a post.
     */
     queryAndDispatchPosts(until: number, upperLimit: number, dispatcher: Dispatcher<PostChunk>);

    /**
     * Query the list of Posts from this channel by a speific range of time.
     *
     * @param start The beginning timestamp
     * @param end The end timestamp
     * @returns An promise object that contains a list of posts.
     */
    queryPostsByRangeOfTime(start: number, end: number): Promise<PostChunk[]>;

    /**
     * Query the list of posts from this channel and dispatch them one by one to
     * customized dispatcher routine.
     *
     * @param start The begining timestamp
     * @param end The end timestamp
     * @param upperLimit The maximum number of this query
     * @param dispatcher The dispatcher routine to deal with a post
     */
    queryAndDispatchPostsRangeOfTime(start: number, end: number, upperLimit: number, dispatcher: Dispatcher<PostChunk>);

    /**
     * Query a post by post identifier.
     *
     * @param postId The post id
     * @returns An promise object that contains the post.
     */
    queryPost(postId: string): Promise<PostChunk>;

    /**
     * Query a post and dispatch it to the routine.
     *
     * @param postId The post id
     * @param dispatcher The routine to deal with the queried post
     */
    queryAndDispatchPost(postId: string, dispatcher: Dispatcher<PostChunk>);

    /**
     * Query the subscriber count of this channel.
     * @returns An promise object that contains the number of subscribers to this channel.
     */
    querySubscriberCount(): Promise<number>;

    /**
     * Query the list of subscribers to this channel.
     *
     * @param earilerThan The timestamp
     * @param upperlimit The maximum number of subscribers for this query.
     */
    querySubscribers(earilerThan: number, upperlimit: number): Promise<Subscriber[]>;

    /**
     *
     * @param until
     * @param upperLimit
     * @param dispatcher
     */
    queryAndDispatchSubscribers(earilerThan: number, upperLimit: number, dispatcher: Dispatcher<Subscriber>);
}
