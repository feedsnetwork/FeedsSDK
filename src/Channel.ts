import { HiveData } from './HiveData'
import { Logger } from './utils/logger'
import { Post } from './Post'

const logger = new Logger("Channel")

export class Channel {
    myChannelInfo: HiveData.ChannelInfo
    subscriptionChannelInfo: HiveData.SubscriptionInfo

    constructor(channelInfo: HiveData.ChannelInfo, subscriptionChannelInfo: HiveData.SubscriptionInfo) {
        this.myChannelInfo = channelInfo
        this.subscriptionChannelInfo = subscriptionChannelInfo
    }

    // getPosts(targetDid: string, channelId: string): Promise<Post[]> {
    //     return new Promise<Post[]>((resolve, reject) => { })
    // }

    // getPostsRangeOfTime(targetDid: string, channelId: string, star: number, end: number): Promise<Post[]> {
    //     return new Promise<Post[]>((resolve, reject) => { })
    // }

    // getPostById(targetDid: string, channelId: string, postId: string): Promise<Post[]> {
    //     return new Promise<Post[]>((resolve, reject) => { })
    // }
}

