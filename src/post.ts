import { RuntimeContext } from './runtimecontext';
import { Logger } from './utils/logger'
import { PostBody } from './postbody'
import { Dispatcher } from './dispatcher';
import { Comment } from './comment'
import { hiveService } from "./hiveService"
import { utils } from "./utils/utils"
import { CommentInfo } from "./commentInfo"
import { hiveService as VaultService } from "./hiveService"

import { ScriptingNames as scripts } from './vault/constants';
import { LikeInfo } from './likeInfo';

const logger = new Logger("Post")

export class Post {
    private body: PostBody;
    private vault: hiveService
    private context: RuntimeContext

    private constructor(body: PostBody) {
        this.body = body;
        this.context = RuntimeContext.getInstance()
        this.vault = new VaultService()
    }

    public getBody(): PostBody {
        return this.body;
    }

    private generateCommentId(did: string, postId: string, refCommentId: string, commentContent: string): string {
        return utils.generateCommentId(did, postId, refCommentId, commentContent)
    }

    public addComment(content: string): Promise<CommentInfo> {
        const userDid = this.context.getUserDid()
        const channelId = this.getBody().getChannelId()
        const postId = this.getBody().getPostId()
        const refcommentId = "0"
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
            this.getBody().getTargetDid(), this.context.getAppDid()).then(result => {
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
    
    public updateComment(commentId: string, content: string): Promise<boolean> {
        const updatedAt = (new Date()).getTime()
        const channelId = this.getBody().getChannelId()
        const postId = this.getBody().getPostId()

        const params = {
            "channel_id": channelId,
            "post_id": postId,
            "comment_id": commentId,
            "content": content,
            "updated_at": updatedAt
        }
        return this.vault.callScript(scripts.SCRIPT_UPDATE_COMMENT, params,
            this.getBody().getTargetDid(), this.context.getAppDid()).then(result => {
                console.log("updateComment ===================== ", result)
                return true
            })
            .catch(error => {
                logger.error("Update comment error : ", error)
                throw new Error(error)
            })
    }

    public deleteComment(commentId: string) {
        const params = {
            "channel_id": this.getBody().getChannelId(),
            "post_id": this.getBody().getPostId(),
            "comment_id": commentId
            }
         const targetDid = this.getBody().getTargetDid()

         return this.vault.callScript(scripts.SCRIPT_DELETE_COMMENT, params,
             targetDid, this.context.getAppDid())
            .then(result => {
                console.log("deleteComment ===================== ", result)
                return true
            })
            .catch(error => {
                logger.error("Delete comment error : ", error)
                    throw new Error(error)
            })
    }

    // 新增
    public queryComments(earlierThan: number, maximum: number): Promise<Comment[]> {
        const params = {
            "channel_id": this.getBody().getChannelId(),
            "post_id": this.getBody().getPostId(),
            "limit": maximum,
            "end": earlierThan 
        }
        return this.vault.callScript(scripts.SCRIPT_COMMENT_BY_END_TIME_AND_LIMIT, params,
            this.getBody().getTargetDid(), this.context.getAppDid()).then(result => {
                return result.find_message.items
        }).catch(error => {
            logger.error('fetch comments error:', error)
            throw new Error(error)
        })
    }

    public queryAndDispatchComments(earlierThan: number, maximum: number,
        dispatcher: Dispatcher<Comment>) {
        return this.queryComments(earlierThan, maximum).then((comments) => {
            comments.forEach(item => {
                dispatcher.dispatch(item)
            })
        }).catch( error => {
            throw new Error(error)
        })
    }

    //post下的评论: 包含子评论
    public queryCommentsRangeOfTime(begin: number, end: number): Promise<Comment[]> {
        const params = {
            "channel_id": this.getBody().getChannelId(),
            "post_id": this.getBody().getPostId(),
            "start": begin,
            "end": end,
            "status": 0
        }
        return this.vault.callScript(scripts.SCRIPT_SOMETIME_COMMENT, params,
            this.getBody().getTargetDid(), this.context.getAppDid())
            .then(result => {

                return result.find_message.items
            })
            .then(result => {
                let comments = []
                result.forEach(item => {
                    const comment = Comment.parse(item)
                    comments.push(comment)
                })
                return comments
            })
            .catch(error => {
            logger.error('fetch comments range of time error:', error)
            throw new Error(error)
        })
    }

    public queryAndDispatchCommentsRangeOfTime(begin: number, end: number,
        dispatcher: Dispatcher<Comment>) {
        return this.queryComments(begin, end).then((comments) => {
            comments.forEach(item => {
                dispatcher.dispatch(item)
            })
        }).catch( error => {
            throw new Error(error)
        })
    }

    public queryCommentById(commentId: string): Promise<Comment> {
            const params = {
                "channel_id": this.getBody().getChannelId(),
                "post_id": this.getBody().getPostId(),
                "comment_id": commentId
            }
        return this.vault.callScript(scripts.SCRIPT_QUERY_COMMENT_BY_COMMENTID, params,
            this.getBody().getTargetDid(), this.context.getAppDid()).then(result => {
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

    public queryAndDispatchCommentById(commentId: string, dispatcher: Dispatcher<Comment>) {
        return this.queryCommentById(commentId).then((comment) => {
            dispatcher.dispatch(comment)
        }).catch( error => {
            throw new Error(error)
        })
    }

    // 同步feeds api
    public queryCommentByPostId(): Promise<Comment[]> {
        const params = {
            "channel_id": this.getBody().getChannelId(),
            "post_id": this.getBody().getPostId(),
        }
        return this.vault.callScript(scripts.SCRIPT_QUERY_COMMENT_BY_POSTID, params,
            this.getBody().getTargetDid(), this.context.getAppDid()).then(result => {
                return result.find_message.items
            })
            .then(result => {
                let comments = []
                result.forEach(item => {
                    const comment = Comment.parse(item)
                    comments.push(comment)
                })
                return comments
            })
            .catch(error => {
                logger.error('fetch comment by id error:', error)
                throw new Error(error);
            })
    }

    public static generateLikeId(postId: string, commentId: string, userDid: string): string {
        return utils.generateLikeId(postId, commentId, userDid)
    }

    // targetDid: comment/post的创建者
    public addLike(likeId: string): Promise<LikeInfo> {
        const createdAt = (new Date()).getTime()
        const params = {
            "like_id": likeId,
            "channel_id": this.getBody().getChannelId(),
            "post_id": this.getBody().getPostId(),
            "comment_id": "0",
            "created_at": createdAt,
            "updated_at": createdAt,
            "status": 0
        }
        return this.vault.callScript(scripts.SCRIPT_CREATE_LIKE, params, this.getBody().getTargetDid(), this.context.getAppDid()).then(result => {
            const likeInfo = LikeInfo.parse(this.context.getUserDid(), params)
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
            "channel_id": this.getBody().getChannelId(),
            "post_id": this.getBody().getPostId(),
            "comment_id": "0",
        }
        return this.vault.callScript(scripts.SCRIPT_REMOVE_LIKE, params, this.getBody().getTargetDid(), this.context.getAppDid()).then(result => {
            return true
        })
            .catch(error => {
                logger.error('Remove like error:', error)
                throw new Error(error)
            })
    }

    // 同步feeds api
    public updateLike(likeInfo: LikeInfo): Promise<LikeInfo> {
        const updatedAt = (new Date()).getTime()
        const params = {
            "updated_at": updatedAt,
            "like_id": likeInfo.getLikeId(),
            "status": likeInfo.getStatus()
        }
        return this.vault.callScript(scripts.SCRIPT_UPDATE_LIKE, params, this.getBody().getTargetDid(), this.context.getAppDid()).then(result => {
            console.log("updateLike result ======== ", result)
            return likeInfo
        })
            .catch(error => {
                logger.error('Update like error:', error)
                throw new Error(error)
            })
    }

    // 同步feeds api 
    public queryLikeByPost(): Promise<any> {
        const params = {
            "channel_id": this.getBody().getChannelId(),
            "post_id": this.getBody().getPostId(),
            "status": 0 // available
        }
        return this.vault.callScript(scripts.SCRIPT_QUERY_LIKE_BY_POST, params, this.getBody().getTargetDid(), this.context.getAppDid()).then(result => {
            console.log("queryLikeByPost result ======== ", result)
            return result.find_message.items
        }).then(result => {
            let likeInfos = []
            result.forEach(item => {
                const like = LikeInfo.parse(this.getBody().getTargetDid(), item)
                likeInfos.push(like)
            })
            return likeInfos
        })
        .catch(error => {
            logger.error('Query like by post error:', error)
            throw new Error(error)
        })
    }

    // 同步feeds api //targetDid: post创建者
    public queryLikeById(): Promise<any> {
        const params = {
            "channel_id": this.getBody().getChannelId(),
            "post_id": this.getBody().getPostId(),
            "comment_id": "0",
            "status": 0 // available
        }
        return this.vault.callScript(scripts.SCRIPT_QUERY_LIKE_BY_ID, params, this.getBody().getTargetDid(), this.context.getAppDid()).then(result => {
            console.log("queryLikeById result ======== ", result)
            return result.find_message.items
        }).then(result => {
            let likeInfos = []
            result.forEach(item => {
                const like = LikeInfo.parse(this.getBody().getTargetDid(), item)
                likeInfos.push(like)
            })
            return likeInfos
        })
        .catch(error => {
            logger.error('Query like by id error:', error)
            throw new Error(error)
            })
    }

    //post //同步feeds api
    public queryLikeByRangeOfTime(start: number, end: number) {
        const params = {
            "channel_id": this.getBody().getChannelId(),
            "post_id": this.getBody().getPostId(),
            "start": start,
            "end": end // available
        }
        return this.vault.callScript(scripts.SCRIPT_SOMETIME_LIKE, params, this.getBody().getTargetDid(), this.context.getAppDid()).then(result => {
            console.log("queryLikeByRangeOfTime result ======== ", result)
            return result.find_message.items
        }).then(result => {
            let likeInfos = []
            result.forEach(item => {
                const like = LikeInfo.parse(this.getBody().getTargetDid(), item)
                likeInfos.push(like)
            })
            return likeInfos
        })
            .catch(error => {
                logger.error('Query like by range of time error:', error)
                throw new Error(error)
            })
    }

    public static parse(targetDid: string, result: any): Post {
        try {
            const postChun = PostBody.parse(targetDid, result)
            const post = new Post(postChun)
            return post
        } catch (error) {
            logger.error('Parse post result error: ', error)
            throw error
        }
    }
}
