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

    updateInfo(channelId: string, newName: string, newIntro: string, newAvatar: string, newType: string, newMemo: string,
        newTippingAddress: string, newNft: string): Promise<boolean> {
        return this.hiveHelper.updateChannel(channelId, newName, newIntro, newAvatar, newType, newMemo, newTippingAddress, newNft)
    }

    post(channelId: string, tag: string, content: string, type: string = 'public', status: number = HiveData.CommonStatus.available, memo: string, proof: string): Promise<Post[]> {
        return this.hiveHelper.publishPost(channelId, tag, content, type, status, memo, proof)
    }

    updatePost(postId: string, channelId: string, newType: string, newTag: string, newContent: string, newStatus: number, newUpdateAt: number, newMemo: string, newProof: string): Promise<boolean> {
        return this.hiveHelper.updatePost(postId, channelId, newType, newTag, newContent, newStatus, newUpdateAt, newMemo, newProof)
    }

    deletePost(postId: string, channelId: string): Promise<HiveData.DeleteResult> {
        return this.hiveHelper.deletePost(postId, channelId)
    }
}

