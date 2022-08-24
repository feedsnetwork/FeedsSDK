import { ChannelInfo } from "./ChannelInfo";
import { Dispatcher } from "./Dispatcher";
import { Post } from "./Post";

export interface ChannelHandler {
    /**
     *
     * @param earlerThan
     * @param upperLimit
     */
    fetchPosts(earlerThan: number, upperLimit: number): Promise<Post[]>

    /**
     *
     * @param until
     * @param dispatcher
     */
    fetchAndDispatchPosts(until: number, upperLimit: number, dispatcher: Dispatcher<Post>)

    /**
     * TODO:
     * @param start
     * @param end
     * @returns
     */
    fetchPostsByRangeOfTime(start: number, end: number): Promise<Post[]>

    /**
     *
     * @param start
     * @param end
     * @param dispatcher
     */
    fetchAndDispatchPostsRangeOfTime(start: number, end: number, upperLimit: number, dispatcher: Dispatcher<Post>)

    /**
     *
     * @param postId
     * @returns
     */
    fetchPost(postId: string): Promise<Post>

    /**
     *
     * @param postId
     * @param dispatcher
     */
    fetchAndDispatchPost(postId: string, dispatcher: Dispatcher<Post>)


    /**
     * Fetch the total number of subscribers to this channel.
     */
    fetchNumberOfSubscribers(): Promise<number>

    /**
     *
     * @param until
     * @param dispatcher
     */
    fetchAndDispatchSubscribers(until: number, upperLimit: number, dispatcher: Dispatcher<Subscriber>);
}
