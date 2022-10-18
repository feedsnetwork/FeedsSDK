import { ChannelInfo } from "./channelinfo"
import { Dispatcher } from "./dispatcher"
import { PostBody } from "./postbody"
import { Profile } from "./profile";

export interface ChannelHandler {
    /**
    * Query the channel infomation from remote channel on Vault.
    * @returns An promise object that contains channel information.
    */
    queryChannelInfo(): Promise<ChannelInfo>

    /**
    * fetch a list of Posts with timestamps that are earlier than specific timestamp
    * and limited number of this list too.
    *
    * @param earilerThan The timestamp than which the posts to be fetched should be
    *                    earlier
    * @param upperLimit The max limit of the posts in this transaction.
    * @returns An promise object that contains a list of posts.
    */
    queryPosts(
        earlierThan: number,
        maximum: number
    ): Promise<PostBody[]>

    /**
    * Query the list of Posts from this channel by a speific range of time.
    *
    * @param start The beginning timestamp
    * @param end The end timestamp
    * @returns An promise object that contains a list of posts.
    */
    queryPostsByRangeOfTime(
        start: number,
        end: number,
        upperLimit: number
    ): Promise<PostBody[]>

    /**
    * Query a post by post identifier.
    *
    * @param postId The post id
    * @returns An promise object that contains the post.
    */
    queryPost(
        postId: string
    ): Promise<PostBody>

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
    querySubscribers(
        earilerThan: number,
        upperlimit: number)
        : Promise<Profile[]>
}
