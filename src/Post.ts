import { Logger } from './utils/logger'
import { HiveData } from './HiveData'
import { HiveHelper } from './HiveHelper'
import { AppContext } from './AppContext'

const logger = new Logger("Post")
export class Post {
    postInfo: HiveData.PostInfo
    private hiveHelper: HiveHelper

    constructor(postInfo: HiveData.PostInfo) {
        this.postInfo = postInfo
        this.hiveHelper = new HiveHelper(AppContext.getInstance())
    }

    public getPostInfo(): HiveData.PostInfo {
        return this.postInfo
    }
    
    addComent(targetDid: string, channelId: string, postId: string, refcommentId: string, content: string): Promise<Comment> {
        return this.hiveHelper.createComment(targetDid, channelId, postId, refcommentId, content)
    }

    updateComment(targetDid: string, channelId: string, postId: string, commentId: string, content: string): Promise<boolean> {
        return this.hiveHelper.updateComment(targetDid, channelId, postId, commentId, content)
    }

    deleteComment(targetDid: string, channelId: string, postId: string, commentId: string): Promise<boolean> {
        return this.hiveHelper.deleteComment(targetDid, channelId, postId, commentId)
    }

    getCommentsByPostId(targetDid: string, channelId: string, postId: string): Promise<Comment[]> {
        return this.hiveHelper.queryCommentByPostId(targetDid, channelId, postId)
    }

    getCommentRangeOfTime(targetDid: string, channelId: string, postId: string, star: number, end: number): Promise<Comment[]> {
        return this.hiveHelper.queryCommentRangeOfTimeScripting(targetDid, channelId, postId, star, end)
    }

}
