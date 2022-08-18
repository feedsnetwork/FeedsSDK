import { HiveData } from './HiveData'
import { Logger } from './utils/logger'
import { Channel } from './Channel'
import { MyChannel } from './MyChannel'
import { SubscriptionChannel } from './SubscriptionChannel'
import { Post } from './Post'

const logger = new Logger("Channel")

export class ParseHiveResult {

    /** parse channel result start */
    // const channels = result.find_message.items
    // const channels = result
    public static parseChannelResult(targetDid: string, result: any): MyChannel[] {
        try {
            /**
             * avatar: "address"
             * channel_id: "ee74ab5fdbc62b42f45c2af1803ba95b684adbab740c88cf30f9b11c61bc1318"
             * created: {$date: 1647859734867}
             * created_at: 1647859737317
             * intro: "channel01 desc"
             * memo: ""
             * modified: {$date: 1647859734867}
             * name: "channelId01"
             * nft: ""
             * tipping_address: ""
             * type: "public"
             * updated_at: 1647859737317
             * proof: ""
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

}


