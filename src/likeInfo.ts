export class LikeInfo {
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

    setDestDid(destDid: string): LikeInfo {
        this.destDid = destDid
        return this
    }

    public getDestDid() {
        return this.destDid
    }

    setCreaterDid(createrDid: string): LikeInfo {
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

    setStatus(status: number): LikeInfo {
        this.status = status
        return this
    }

    public getStatus() {
        return this.status
    }

    setUpdatedAt(updatedAt: number): LikeInfo {
        this.updatedAt = updatedAt
        return this
    }

    public getUpdatedAt() {
        return this.updatedAt
    }

    setCreatedAt(createdAt: number): LikeInfo {
        this.createdAt = createdAt
        return this
    }

    public getCreatedAt() {
        return this.createdAt
    }

    setProof(proof: string): LikeInfo {
        this.proof = proof
        return this
    }

    public getProof() {
        return this.proof
    }

    setMemo(memo: string): LikeInfo {
        this.memo = memo
        return this
    }

    public getMemo() {
        return this.memo
    }

    public static parse(targetDid: string, like: any): LikeInfo {
        //TODO:
        const likeInfo = new LikeInfo('', '', '', '')
        likeInfo.setDestDid(targetDid)
        likeInfo.setDestDid('')
        likeInfo.setCreaterDid('')
        likeInfo.setStatus(0)
        likeInfo.setCreatedAt(0)
        likeInfo.setUpdatedAt(0)
        likeInfo.setProof('')
        likeInfo.setMemo('')

        return likeInfo
    }
}
