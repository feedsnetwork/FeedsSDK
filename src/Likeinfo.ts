export class Likeinfo {
    private likeId: string
    private postId: string
    private commentId: string
    private channelId: string
    private destDid: string
    private createrDid: string
    private status: number
    private createdAt: number
    private updatedAt: number
    private proof: string
    private memo: string

    constructor(likeId: string, postId: string, commentId: string, channelId: string) {
        this.likeId = likeId
        this.postId = postId
        this.commentId = commentId
        this.channelId = channelId
    }

    setDestDid(destDid: string): Likeinfo {
        this.destDid = destDid
        return this
    }

    public getDestDid() {
        return this.destDid
    }

    setCreaterDid(createrDid: string): Likeinfo {
        this.createrDid = createrDid
        return this
    }

    public getCreaterDid() {
        return this.createrDid
    }

    public getChannelId() {
        return this.channelId
    }

    public getPostId() {
        return this.postId
    }

    public getLikeId() {
        return this.likeId
    }

    public getCommentId() {
        return this.commentId
    }

    setStatus(status: number): Likeinfo {
        this.status = status
        return this
    }

    public getStatus() {
        return this.status
    }

    setUpdatedAt(updatedAt: number): Likeinfo {
        this.updatedAt = updatedAt
        return this
    }

    public getUpdatedAt() {
        return this.updatedAt
    }

    setCreatedAt(createdAt: number): Likeinfo {
        this.createdAt = createdAt
        return this
    }

    public getCreatedAt() {
        return this.createdAt
    }

    setProof(proof: string): Likeinfo {
        this.proof = proof
        return this
    }

    public getProof() {
        return this.proof
    }

    setMemo(memo: string): Likeinfo {
        this.memo = memo
        return this
    }

    public getMemo() {
        return this.memo
    }

    public static parse(targetDid: string, like: any): Likeinfo {
        const likeInfo = new Likeinfo(like.like_id, like.post_id, like.comment_id, like.channel_id)
        likeInfo.setDestDid(targetDid)
        likeInfo.setCreaterDid(like.creater_did)
        likeInfo.setStatus(like.status)
        likeInfo.setCreatedAt(like.created_at)
        likeInfo.setUpdatedAt(like.updated_at)
        likeInfo.setProof(like.proof)
        likeInfo.setMemo(like.memo)

        return likeInfo
    }
}
