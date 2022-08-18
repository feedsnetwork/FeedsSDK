import { Logger } from './utils/logger'
import { Channel } from './Channel'
import { HiveData } from './HiveData'
import { HiveHelper } from './HiveHelper'
import { AppContext } from './AppContext'

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

    getPosts() {

    }

    getPostsRangeOfTime() {

    }

    getPostById() {

    }
}

