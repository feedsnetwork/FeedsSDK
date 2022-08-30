import { Post } from "./Post";

const enum MediaType {
    noMeida = 0,
    containsImg = 1,
    containsVideo = 2,
}

export type PostContent = {
    version: string,
    content: string,
    mediaData: MediaData[],// 已经上传的到hive(size/type/scriptName@path)
    mediaType: MediaType
}

type MediaData = {
    kind: string,           //"image/video/audio"
    originMediaPath: string,
    type: string,           //"image/jpg",
    size: number,           //origin file size
    thumbnailPath: string    //"thumbnailCid"
    duration: number,
    imageIndex: number,
    additionalInfo: any,
    memo: any
}


export class PostChunk {
   
    private readonly targetDid: string;
    private readonly postId: string;
    private readonly channelId: string;
    private createdAt: string;
    private updatedAt: string;
    private content: PostContent;
    private status: string;
    private type: string;
    private tag: string;
    private proof: string;
    private memo: string;

    private constructor(targetDid: string, postId: string, channelId: string) {
        this.targetDid = targetDid;
        this.postId = postId;
        this.channelId = channelId;
    }

    public setCreatedAt(createdAt: string): PostChunk {
        this.createdAt = createdAt;
        return this;
    }

    public setUpdatedAt(updatedAt: string): PostChunk {
        this.updatedAt = updatedAt;
        return this;
    }

    public setContent(content: PostContent): PostChunk {
        this.content = content;
        return this;
    }

    public setStatus(status: string): PostChunk {
        this.status = status;
        return this;
    }
    public setType(type: string): PostChunk {
        this.type = type;
        return this;
    }

    public setTag(tag: string): PostChunk {
        this.tag = tag;
        return this;
    }

    public setProof(proof: string): PostChunk {
        this.proof = proof;
        return this;
    }

    public setMemo(memo: string): PostChunk {
        this.memo = memo;
        return this;
    }

    public static parse(targetDid: string, result: any): PostChunk {
        let contents = null
        let postContent: PostContent = {
            version: '',
            content: '',
            mediaData: [],
            mediaType: MediaType.noMeida
        }
        try {
            contents = JSON.parse(result['content'])
        } catch (error) {
            throw error
        }

        if (contents) {
            let mDatas = contents['mediaData']
            let mData = {}
            for (let index = 0; index < mDatas.length; index++) {
                mData = mDatas[index]
            }
            const mediaData: MediaData = {
                kind: mData['kind'],
                originMediaPath: mData['originMediaPath'],
                type: mData['type'],
                size: mData['size'],
                thumbnailPath: mData['thumbnailPath'],
                duration: mData['duration'],
                imageIndex: mData['imageIndex'],
                additionalInfo: mData['additionalInfo'],
                memo: mData['memo']
            }
            let mediaDatas = []
            mediaDatas.push(mediaData)

            // postContent
            postContent = {
                version: contents['version'],
                content: contents['content'],
                mediaData: mediaDatas,
                mediaType: contents['mediaType']
            }
        }
        const postChunk = new PostChunk(targetDid, result.post_id, result.channel_id)
        postChunk.setCreatedAt(result.created_at)
        postChunk.setUpdatedAt(result.updated_at)
        postChunk.content(postContent)
        postChunk.setStatus(result.status)
        postChunk.setType(result.type)
        postChunk.setTag(result.tag)
        postChunk.setProof(result.proof)
        postChunk.setMemo(result.memo)

        return postChunk
    }
}