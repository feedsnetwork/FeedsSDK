import { Logger } from './utils/logger'
import { CommentInfo } from './commentInfo'
import { RuntimeContext } from './runtimecontext'
import { hiveService as VaultService } from "./hiveService"
import { utils } from "./utils/utils"
import { ScriptingNames as scripts } from './vault/constants';
import { Likeinfo } from "./Likeinfo"

const logger = new Logger("Comment")

export class Comment {
    private commentInfo: CommentInfo
    private context: RuntimeContext
    private vault: VaultService

    constructor(commentInfo: CommentInfo) {
        this.context = RuntimeContext.getInstance()
        this.commentInfo = commentInfo
        this.vault = new VaultService()
    }

    private generateCommentId(did: string, postId: string, refCommentId: string, commentContent: string): string {
        return utils.generateCommentId(did, postId, refCommentId, commentContent)
    }

    public getCommentInfo(): CommentInfo {
        return this.commentInfo
    }

    public addComment(content: string): Promise<CommentInfo> {
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

        return this.vault.callScript(scripts.SCRIPT_CREATE_COMMENT, params,
            this.getCommentInfo().getCreaterDid(), this.context.getAppDid()).then(result => {
                console.log("addComment ===================== ", result)
                params["updated_at"] = createdAt
                params["status"] = 0
                params["creater_did"] = this.context.getUserDid()
                const commentInfo = CommentInfo.parse(params)
                return commentInfo
            })
            .catch(error => {
                logger.error("Add coment error : ", error)
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
        return this.vault.callScript(scripts.SCRIPT_UPDATE_COMMENT, params,
            this.getCommentInfo().getCreaterDid(), this.context.getAppDid()).then(result => {
                console.log("Comment---->>>> updateComment ============ ", result)
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
        const targetDid = this.getCommentInfo().getCreaterDid()

        return this.vault.callScript(scripts.SCRIPT_DELETE_COMMENT, params,
            targetDid, this.context.getAppDid())
            .then(result => {
                console.log("Comment---->>>> deleteComment ============ ", result)
                return true
            })
            .catch(error => {
                logger.error("Update comment error : ", error)
                throw new Error(error)
            })
    }

    public queryCommentById(): Promise<Comment> {
        const params = {
            "channel_id": this.getCommentInfo().getChannelId(),
            "post_id": this.getCommentInfo().getPostId(),
            "comment_id": this.getCommentInfo().getCommentId()
        }
        return this.vault.callScript(scripts.SCRIPT_QUERY_COMMENT_BY_COMMENTID, params,
            this.getCommentInfo().getCreaterDid(), this.context.getAppDid()).then(result => {
                console.log("Comment---->>>> queryCommentById ============ ", result)
                return result.find_message.items
            })
            .then(result => {
                let comments = []
                result.forEach(item => {
                    const comment = Comment.parse(item)
                    comments.push(comment)
                })
                return comments[0]
            })
            .catch(error => {
                logger.error('fetch comment by id error:', error)
                throw new Error(error);
            })
    }

    // targetDid: comment/post的创建者
    public addLike(likeId: string): Promise<Likeinfo> {
        const createdAt = (new Date()).getTime()
        const params = {
            "like_id": likeId,
            "channel_id": this.getCommentInfo().getChannelId(),
            "post_id": this.getCommentInfo().getPostId(),
            "comment_id": this.getCommentInfo().getCommentId(),
            "created_at": createdAt,
            "updated_at": createdAt,
            "status": 0
        }
        return this.vault.callScript(scripts.SCRIPT_CREATE_LIKE, params, this.getCommentInfo().getCommentId(), this.context.getAppDid()).then(result => {
            console.log("Comment---->>>> addLike ============ ", result)
            const likeInfo = Likeinfo.parse(this.context.getUserDid(), params)
            return likeInfo
        })
            .catch(error => {
                logger.error('Add like error:', error)
                throw new Error(error)
            })
    }

    // targetDid: comment/post的创建者
    public removeLike(): Promise<boolean> {
        const params = {
            "channel_id": this.getCommentInfo().getChannelId(),
            "post_id": this.getCommentInfo().getPostId(),
            "comment_id": this.getCommentInfo().getCommentId(),
        }
        return this.vault.callScript(scripts.SCRIPT_REMOVE_LIKE, params, this.getCommentInfo().getCreaterDid(), this.context.getAppDid()).then(result => {
            console.log("Comment---->>>> removeLike ============ ", result)
            return true
        })
            .catch(error => {
                logger.error('Remove like error:', error)
                throw new Error(error)
            })
    }

    // 同步feeds api
    public updateLike(targetDid: string, likeInfo: Likeinfo): Promise<Likeinfo> {
        const updatedAt = (new Date()).getTime()
        const params = {
            "updated_at": updatedAt,
            "like_id": likeInfo.getLikeId(),
            "status": likeInfo.getStatus()
        }
        return this.vault.callScript(scripts.SCRIPT_UPDATE_LIKE, params, targetDid, this.context.getAppDid()).then(result => {
            console.log("updateLike result ======== ", result)
            return likeInfo
        })
            .catch(error => {
                logger.error('Update like error:', error)
                throw new Error(error)
            })
    }

    // 同步feeds api //targetDid: 
    public queryLikeById(commentId: string): Promise<any> {
        const params = {
            "channel_id": this.getCommentInfo().getChannelId(),
            "post_id": this.getCommentInfo().getPostId(),
            "comment_id": commentId,
            "status": 0 // available
        }
        return this.vault.callScript(scripts.SCRIPT_QUERY_LIKE_BY_ID, params, this.getCommentInfo().getCreaterDid(), this.context.getAppDid()).then(result => {
            console.log("queryLikeById result ======== ", result)
            return result.find_message.items
        }).then(result => {
            let likeInfos = []
            result.forEach(item => {
                const like = Likeinfo.parse(this.getCommentInfo().getCreaterDid(), item)
                likeInfos.push(like)
            })
            return likeInfos
        })
            .catch(error => {
                logger.error('Query like by id error:', error)
                throw new Error(error)
            })
    }

    public static parse(data: any): Comment {
        const commentInfo = CommentInfo.parse(data)
        const comment = new Comment(commentInfo)
        return comment
    }
} 

