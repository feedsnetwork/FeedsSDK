import { Logger } from './utils/logger'
import { CommentInfo } from './commentInfo'
import { RuntimeContext } from './runtimeContext'

const logger = new Logger("Comment")

export class Comment {
    private commentInfo: CommentInfo
    private context: RuntimeContext

    constructor(commentInfo: CommentInfo) {
        this.context = RuntimeContext.getInstance()
        this.commentInfo = commentInfo
    }

    public getCommentInfo(): CommentInfo {
        return this.commentInfo
    }
} 

