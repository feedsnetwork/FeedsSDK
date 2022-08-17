import { Hive } from '@elastosfoundation/elastos-connectivity-sdk-js';
import { HiveData } from './HiveData';
import { Logger } from './utils/logger'
import { Channel } from './Channel'

const logger = new Logger("Channel")

export class ParseHiveResult {

    /** parse channel result start */
    // const channels = result.find_message.items;
    // const channels = result
    public static parseChannelResult(targetDid: string, result: any): Channel[] {
        try {
            /**
             * avatar: "address"
             * channel_id: "b434c0d62c83ccdf1ecaabf831894f87b086c58bd2f4711d889ae832056d9c7d"
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
                        const channel = new Channel(channelInfo)
                        parseResult.push(channel)
                    }
                });
            }
            return parseResult
        } catch (error) {
            logger.error('Parse channel result error', error)
            throw error
        }
    }
    /** parse channel result end */

}


