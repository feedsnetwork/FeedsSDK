import { Logger } from './utils/logger'
import { Channel } from './Channel'
import { HiveData } from './HiveData'
import { HiveHelper } from './HiveHelper'
import { AppContext } from './AppContext'
import { Post } from './Post'

const logger = new Logger("MyChannel")
export class MyChannel extends Channel {
    private hiveHelper: HiveHelper

    constructor(myChnnelInfo: HiveData.ChannelInfo) {
        super(myChnnelInfo, null)
        // TODO: AppContext.isInitialized()
        this.hiveHelper = new HiveHelper(AppContext.getInstance())
    }

    public getMyChannelInfo(): HiveData.ChannelInfo {
        return this.myChannelInfo
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

    updateInfo() {

    }

    post() {

    }

    updatePost() {

    }

    deletePost() {

    }
}

