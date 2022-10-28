import { ChannelInfo } from "./channelinfo";
import { PostBody } from "./postbody";

interface ProfileHandler {
    /**
     * Query the total number of owned channels.
     * @returns A promise object that contains the number of owned channels.
     */
    queryOwnedChannelCount(): Promise<number>;

    /**
     * Query a list of owned channel.
     * @returns A promise object that contains a list of channel.
     */
    queryOwnedChannels(): Promise<ChannelInfo[]>;

    /**
     * Query specific owned channel by channel identifier
     * @param channelId
     * @returns A promise object that contains Channel
     */
    queryOwnedChannnelById(channelId: string): Promise<ChannelInfo>;

    /**
     * Query the total acount of subscribed channels.
     * @returns A promise object that contain the total number of subscribed channels.
     */
     querySubscribedChannelCount(): Promise<number>;

    /**
     *  Query a list of subscribed channels.
     * @param start
     * @param end
     * @param capacity
     */
    querySubscribedChannels(startTime: number, endTime: number, capacity: number): Promise<ChannelInfo[]>;

    /**
     *
     * @param channelId
     */
    querySubscribedChannelById(channelId: string): Promise<ChannelInfo>;


    queryLikedPostsNumber(): Promise<number>;
    queryLikedPosts(startTime: number, endTime: number, capacity: number): Promise<PostBody[]>
    queryLikedPostById(likeId: string): Promise<PostBody>;
}

export type {
    ProfileHandler
}
