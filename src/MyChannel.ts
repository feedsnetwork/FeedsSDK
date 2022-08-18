import { Logger } from './utils/logger'
import { Channel } from './Channel'
import { HiveData } from './HiveData'
import { HiveHelper } from './HiveHelper'
import { AppContext } from './AppContext'
import { Post } from './Post'

const logger = new Logger("MyChannel")
export class MyChannel extends Channel {
    private hiveHelper: HiveHelper
    private userDid = ''

    constructor(myChnnelInfo: HiveData.ChannelInfo) {
        super(myChnnelInfo, null)
        // TODO: AppContext.isInitialized()
        this.hiveHelper = new HiveHelper(AppContext.getInstance())
        this.userDid = AppContext.getInstance().userDid
    }

    public getMyChannelInfo(): HiveData.ChannelInfo {
        return this.myChannelInfo
    }

    public getMyPosts(): Promise<Post[]> {
        return this.hiveHelper.queryMyPosts()
    }

    getMyPostsByChannelId(channelId: string): Promise<Post[]> {
        return this.hiveHelper.queryMyPostsByChannel(channelId)
    }

    getMyPostsRangeOfTime(channelId: string, star: number, end: number): Promise<Post[]> {
        return this.hiveHelper.queryPostRangeOfTimeScripting(this.userDid, channelId, star, end)
    }

    getMyPostById(channelId: string, postId: string): Promise<Post[]> {
        return this.hiveHelper.queryPostById(this.userDid, channelId, postId)
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

