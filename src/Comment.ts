import { HiveData } from './HiveData'
import { HiveHelper } from './HiveHelper'
import { AppContext } from './AppContext'
import { Logger } from './utils/logger'

const logger = new Logger("Comment")

export class Comment {
    private commentInfo: HiveData.CommentInfo
    private hiveHelper: HiveHelper

    constructor(commentInfo: HiveData.CommentInfo) {
        this.commentInfo = commentInfo
        this.hiveHelper = new HiveHelper(AppContext.getInstance())
    }

    public getCommentInfo(): HiveData.CommentInfo {
        return this.commentInfo
    }
}

