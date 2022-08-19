import { HiveData } from './HiveData'
import { Logger } from './utils/logger'
import { MyChannel } from './MyChannel'
import { SubscriptionChannel } from './SubscriptionChannel'
import { Post } from './Post'
import { Comment } from './Comment'

const logger = new Logger("Channel")

export class ParseHiveResult {

    /** parse channel result start */
    // const channels = result.find_message.items
    // const channels = result
    public static parseChannelResult(targetDid: string, result: any): MyChannel[] {
        try {
            /**
            [{
                "channel_id": "50f0854a02059abb941849c5a66d7513091d1bbabec8b9fa582b17bbe3689b1d",
                "name": "\u8fce\u98ce\u4e00\u68d2\u69cc\u4e00\u4e00",
                "intro": "\u68d2\u69cc",
                "avatar": "d30054aa1d08abfb41c7225eb61f18e4@feeds/data/d30054aa1d08abfb41c7225eb61f18e4",
                "created_at": 1660790457510,
                "updated_at": 1660790457510,
                "type": "public",
                "tipping_address": "[{\"type\":\"ELA\",\"address\":\"\"}]",
                "nft": "",
                "memo": "",
                "category": "",
                "proof": "",
                "created": 1660790458,
                "modified": 1660790458
            }]
            */
            const channels = result
            let parseResult = []
            if (channels) {
                channels.forEach(item => {
                    if (item) {
                        const channelInfo: HiveData.ChannelInfo = {
                            destDid: targetDid,
                            channelId: item.channel_id,
                            name: item.name,
                            avatar: item.avatar,
                            intro: item.intro,
                            createdAt: item.created_at,
                            updatedAt: item.updated_at,
                            type: item.type,
                            paymentAddress: item.tipping_address,
                            nft: item.nft,
                            category: item.category,
                            proof: item.proof,
                            memo: item.memo,
                        }
                        const myChannel = new MyChannel(channelInfo)
                        parseResult.push(myChannel)
                    }
                })
            }
            return parseResult
        } catch (error) {
            logger.error('Parse channel result error', error)
            throw error
        }
    }
    /** parse channel result end */

    /** parse subscription result start */
    public static parseSubscriptionResult(destDid: string, result: any): SubscriptionChannel[] {
        try {
        /**
        [
            {
              "channel_id": "ee74ab5fdbc62b42f45c2af1803ba95b684adbab740c88cf30f9b11c61bc1318",
              "user_did": "did:elastos:im3J2p3cCYLpesar34bzkL7gm37exb8sA7",
              "created_at": 1658194848228,
              "display_name": "321",
              "updated_at": 1658194848227,
              "status": 0,
              "created": 1658194849.082569,
              "modified": 1658194849.082569
            }]
        */
            const subscriptions = result.find_message.items
            let parseResult = []
            console.log('result', subscriptions) 
            if (subscriptions) {
                subscriptions.forEach(item => {
                    const subscriptionInfo: HiveData.SubscriptionInfo = {
                        destDid: destDid,
                        channelId: item.channel_id,
                        userDid: item.user_did,
                        createdAt: item.created_at,
                        displayName: item.display_name,
                        updatedAt: item.updated_at,
                        status: item.status
                    }
                    const subscriptionChannel = new SubscriptionChannel(subscriptionInfo)
                    parseResult.push(subscriptionChannel)
                })
            }
            return parseResult
        } catch (error) {
            logger.error('Parse subscription result error', error)
        }
    }
  /** parse subscription result end */


    /** parse post result start */
    // const posts = result.find_message.items 
    // const post = result 
    public static parsePostResult(targetDid: string, result: any): Post[] {
        try {
            /**
             * [
                {
                  "_id": {
                    "$oid": "62ddfd0ee51fb32c56d6dd93"
                  },
                  "channel_id": "ee74ab5fdbc62b42f45c2af1803ba95b684adbab740c88cf30f9b11c61bc1318",
                  "post_id": "daaf87870018c750f8f544e469fc8c78d12f9375b75ffe506c91d3c4cabb8841",
                  "created_at": 1658715401351,
                  "updated_at": 1658715401351,
                  "content": "{\"version\":\"3.0\",\"content\":\"\u6211\u662f\u6d4b\u8bd5\u4e00\u4e0b\",\"mediaData\":[],\"mediaType\":0}",
                  "status": 0,
                  "memo": "",
                  "type": "public",
                  "tag": "",
                  "proof": "",
                  "created": {
                    "$date": "2022-07-25T02:16:46.175Z"
                  },
                  "modified": {
                    "$date": "2022-07-25T02:16:46.175Z"
                  }
                }] 
                */
            const posts = result
            let parseResult = []
            if (posts) {
                posts.forEach(item => {
                    if (item) {
                        let contents = null
                        let parsedContents: HiveData.postContent = {
                            version: '',
                            mediaData: [],
                            content: '',
                            mediaType: HiveData.MediaType.noMeida
                        }
                        try {
                            contents = JSON.parse(item['content'])
                            // contents = JSON.parse(item['content'])
                        } catch (error) {
                            logger.error('Parse post result error', error)
                            throw error
                        }

                        if (contents) {
                            let mDatas = contents['mediaData']
                            let mData = {}
                            for (let index = 0; index < mDatas.length; index++) {
                                mData = mDatas[index]
                            }
                            // mediaData
                            const mediaDataV3: HiveData.mediaData = {
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
                            let mediaDatasV3: HiveData.mediaData[] = []
                            mediaDatasV3.push(mediaDataV3)

                            // postContent
                            parsedContents = {
                                version: contents['version'],
                                mediaData: mediaDatasV3,
                                content: contents['content'],
                                mediaType: contents['mediaType']
                            }
                        }

                        // PostInfo
                        const postInfo: HiveData.PostInfo = {
                            destDid: targetDid,
                            postId: item.post_id,
                            channelId: item.channel_id,
                            createdAt: item.created_at,
                            updatedAt: item.updated_at,
                            content: parsedContents,
                            status: item.status,
                            type: item.type,
                            tag: item.tag,
                            proof: '',
                            memo: item.memo
                        }
                        const post = new Post(postInfo)
                        parseResult.push(post)
                    }
                })
            }
            return parseResult
        } catch (error) {
            logger.error('Parse post result error', error)
        }
    }
  /** parse post result end */

    // result.find_message.items
    public static parseCommentResult(destDid: string, result: any): Comment[] {
        try {
            /**
            [
                {
                  "comment_id": "6322716190123240ea27db9f758caee9722d4dbc628e30e2030d389cea52b9a6",
                  "channel_id": "ee74ab5fdbc62b42f45c2af1803ba95b684adbab740c88cf30f9b11c61bc1318",
                  "post_id": "9e273cd351ab9369b74e9d4ff94582243389eaad97f2640c1122e5aa78e0ffac",
                  "refcomment_id": "0",
                  "content": "\u5f00\u5f00\u5fc3\u5fc3",
                  "status": 0,
                  "created_at": 1660875281028,
                  "updated_at": 1660875281028,
                  "creater_did": "did:elastos:im3J2p3cCYLpesar34bzkL7gm37exb8sA7"
                }]
            */
            const comments = result.find_message.items
            let parseResult = []
            logger.trace('parse comment result: ', comments)
            if (comments) {
                comments.forEach(item => {
                    if (item) {
                        const commentInfo: HiveData.CommentInfo = {
                            destDid: destDid,
                            commentId: item.comment_id,
                            channelId: item.channel_id,
                            postId: item.post_id,
                            refcommentId: item.refcomment_id,
                            content: item.content,
                            status: item.status,
                            updatedAt: item.updated_at,
                            createdAt: item.created_at,
                            createrDid: item.creater_did
                        }
                        const comment = new Comment(commentInfo)
                        parseResult.push(comment)
                    }
                })
            }
            return parseResult
        } catch (error) {
            logger.error('Parse comment result error', error)
        }
    }

    public static handleCreateCommentResult(destDid: string, userDid: string, params: any): Comment {
        const commentInfo: HiveData.CommentInfo = {
            destDid: destDid,
            createrDid: userDid,
            commentId: params.commentId,
            channelId: params.channelId,
            postId: params.postId,
            refcommentId: params.refcommentId,
            content: params.content,
            status: HiveData.CommonStatus.available,
            updatedAt: params.createdAt,
            createdAt: params.createdAt,
        }
        const comment = new Comment(commentInfo)

        return comment
    }
}


