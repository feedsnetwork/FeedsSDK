import { ChannelInfo } from "./ChannelInfo"
import { Dispatcher } from "./Dispatcher"
import { PostBody } from "./postbody"
import { Profile } from "./profile";

export interface ChannelHandler {
    queryChannelInfo(): Promise<ChannelInfo>

    queryAndDispatchChannelInfo(
        dispatcher: Dispatcher<ChannelInfo>
    ): Promise<void>

    queryPosts(
        earlierThan: number,
        maximum: number
    ): Promise<PostBody[]>

    queryAndDispatchPosts(
        until: number,
        upperLimit: number,
        dispatcher: Dispatcher<PostBody>
    ): Promise<void>

    queryPostsByRangeOfTime(
        start: number,
        end: number,
        upperLimit: number
    ): Promise<PostBody[]>

    queryAndDispatchPostsByRangeOfTime(
        start: number,
        end: number,
        upperLimit: number,
        dispatcher: Dispatcher<PostBody>
    )

    queryPost(
        postId: string
    ): Promise<PostBody>

    queryAndDispatchPost(
        postId: string,
        dispatcher: Dispatcher<PostBody>
    ): Promise<void>

    querySubscriberCount(): Promise<number>;

    querySubscribers(
        earilerThan: number,
        upperlimit: number)
    : Promise<Profile[]>

    queryAndDispatchSubscribers(
        earilerThan: number,
        upperLimit: number,
        dispatcher: Dispatcher<Profile>
    ): Promise<void>
}
