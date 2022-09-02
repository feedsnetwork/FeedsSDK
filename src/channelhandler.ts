import { ChannelInfo } from "./ChannelInfo"
import { Dispatcher } from "./Dispatcher"
import { PostChunk } from "./PostChunk"
import { Profile } from "./profile";

export interface ChannelHandler {
    queryChannelInfo(): Promise<ChannelInfo>

    queryAndDispatchChannelInfo(
        dispatcher: Dispatcher<ChannelInfo>
    )

    queryPosts(
        earlierThan: number,
        maximum: number
    ): Promise<PostChunk[]>

    queryAndDispatchPosts(
        until: number,
        upperLimit: number,
        dispatcher: Dispatcher<PostChunk>
    )

    queryPostsByRangeOfTime(
        start: number,
        end: number,
        upperLimit: number
    ): Promise<PostChunk[]>

    queryAndDispatchPostsByRangeOfTime(
        start: number,
        end: number,
        upperLimit: number,
        dispatcher: Dispatcher<PostChunk>
    )

    queryPost(
        postId: string
    ): Promise<PostChunk>

    queryAndDispatchPost(
        postId: string,
        dispatcher: Dispatcher<PostChunk>
    )

    querySubscriberCount(): Promise<number>;

    querySubscribers(
        earilerThan: number,
        upperlimit: number)
    : Promise<Profile[]>

    queryAndDispatchSubscribers(
        earilerThan: number,
        upperLimit: number,
        dispatcher: Dispatcher<Profile>
    )
}
