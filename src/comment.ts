import { Logger } from './utils/logger'
import { CommentInfo } from './commentInfo'
import { RuntimeContext } from './runtimecontext'
import { hiveService as VaultService } from "./hiveService"
import { utils } from "./utils/utils"
import { ScriptingNames as scripts } from './vault/constants';

const logger = new Logger("Comment")

export class Comment {
    private commentInfo: CommentInfo
    private context: RuntimeContext
    private vault: VaultService
    private targetDid: string

    constructor(targetDid: string, commentInfo: CommentInfo) {
        this.context = RuntimeContext.getInstance()
        this.commentInfo = commentInfo
        this.vault = new VaultService()
        this.targetDid = targetDid
    }

    private generateCommentId(did: string, postId: string, refCommentId: string, commentContent: string): string {
        return utils.generateCommentId(did, postId, refCommentId, commentContent)
    }

    public getCommentInfo(): CommentInfo {
        return this.commentInfo
    }

    public getTargetDid(): string {
        return this.targetDid
    }

    public addComment(content: string): Promise<Comment> {
        const userDid = this.context.getUserDid()
        const channelId = this.getCommentInfo().getChannelId()
        const postId = this.getCommentInfo().getPostId()
        const refcommentId = this.getCommentInfo().getCommentId()
        const commentId = this.generateCommentId(userDid, postId, refcommentId, content)
        const createdAt = (new Date()).getTime()
        let params = {
            "comment_id": commentId,
            "channel_id": channelId,
            "post_id": postId,
            "refcomment_id": refcommentId,
            "content": content,
            "created_at": createdAt,
        }
        logger.debug("add comment params: ", params)

        return this.vault.callScript(scripts.SCRIPT_CREATE_COMMENT, params,
            this.getCommentInfo().getCreaterDid(), this.context.getAppDid()).then(result => {
                logger.debug("add comment success: ", result)
                params["updated_at"] = createdAt
                params["status"] = 0
                params["creater_did"] = this.context.getUserDid()
                const comment = Comment.parse(this.targetDid, params)
                return comment
            })
            .catch(error => {
                logger.error("Add comment error : ", error)
                throw new Error(error)
            })
    }

    public updateComment(content: string): Promise<boolean> {
        const updatedAt = (new Date()).getTime()
        const channelId = this.getCommentInfo().getChannelId()
        const postId = this.getCommentInfo().getPostId()

        const params = {
            "channel_id": channelId,
            "post_id": postId,
            "comment_id": this.getCommentInfo().getCommentId(),
            "content": content,
            "updated_at": updatedAt
        }
        logger.debug("update comment params: ", params)
        return this.vault.callScript(scripts.SCRIPT_UPDATE_COMMENT, params,
            this.getCommentInfo().getCreaterDid(), this.context.getAppDid()).then(result => {
                logger.debug("update comment success: ", result)
                return true
            })
            .catch(error => {
                logger.error("Update comment error : ", error)
                throw new Error(error)
            })
    }

    public deleteComment() {
        const params = {
            "channel_id": this.getCommentInfo().getChannelId(),
            "post_id": this.getCommentInfo().getPostId(),
            "comment_id": this.getCommentInfo().getCommentId()
        }
        logger.debug("delete comment params: ", params)
        const targetDid = this.getCommentInfo().getCreaterDid()

        return this.vault.callScript(scripts.SCRIPT_DELETE_COMMENT, params,
            targetDid, this.context.getAppDid())
            .then(result => {
                logger.debug("delete comment success: ", result)
                return true
            })
            .catch(error => {
                logger.error("delete comment error : ", error)
                throw new Error(error)
            })
    }

    public queryCommentById(): Promise<Comment> {
        const params = {
            "channel_id": this.getCommentInfo().getChannelId(),
            "post_id": this.getCommentInfo().getPostId(),
            "comment_id": this.getCommentInfo().getCommentId()
        }
        logger.debug("query comment byId params: ", params)
        return this.vault.callScript(scripts.SCRIPT_QUERY_COMMENT_BY_COMMENTID, params,
            this.getCommentInfo().getCreaterDid(), this.context.getAppDid()).then(result => {
                logger.debug("query comment byId success: ", result)
                return result.find_message.items
            })
            .then(result => {
                let comments = []
                result.forEach(item => {
                    const comment = Comment.parse(this.targetDid, item)
                    comments.push(comment)
                })
                logger.debug("query comment by id 'comments': ", comments)
                return comments[0]
            })
            .catch(error => {
                logger.error('query comment by id error:', error)
                throw new Error(error);
            })
    }

    public static parse(targetDid: string, data: any): Comment {
        const commentInfo = CommentInfo.parse(targetDid, data)
        const comment = new Comment(targetDid, commentInfo)
        return comment
    }
} 

