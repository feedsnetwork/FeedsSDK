import { Logger } from './utils/logger'
import { Channel } from './Channel'
import { HiveData } from './HiveData'
import { HiveHelper } from './HiveHelper'
import { AppContext } from './AppContext'
import { Post } from './Post'

const logger = new Logger("MyChannel")
export class SubscriptionChannel extends Channel {
    private hiveHelper: HiveHelper

    constructor(subscriptionChannelInfo: HiveData.SubscriptionInfo) {
        super(null, subscriptionChannelInfo)
        // TODO: AppContext.isInitialized()
        this.hiveHelper = new HiveHelper(AppContext.getInstance())
    }

    public getSubscriptionChannelInfo(): HiveData.SubscriptionInfo {
        return this.subscriptionChannelInfo
    }

    getPosts(targetDid: string, channelId: string): Promise<Post[]> {
        return this.hiveHelper.queryPostByChannelId(targetDid, channelId)
    }

    getPostsRangeOfTime(targetDid: string, channelId: string, star: number, end: number): Promise<Post[]> {
        return this.hiveHelper.queryPostRangeOfTimeScripting(targetDid, channelId, star, end)
    }

    getPostById(targetDid: string, channelId: string, postId: string): Promise<Post[]> {
        return this.hiveHelper.queryPostById(targetDid, channelId, postId)
    }
}

