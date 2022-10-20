import { RuntimeContext } from './runtimecontext'
import { Logger } from './utils/logger'
import { MediaType, VideoData, MediaData, PostContent, OriginMediaData } from './postbody'
import { hiveService } from "./hiveService"
import { utils } from "./utils/utils"
import { hiveService as VaultService } from "./hiveService"
import SparkMD5 from 'spark-md5'

const logger = new Logger("MediaHelper")

export class MediaHelper {
    private vault: hiveService
    private context: RuntimeContext

    public constructor() {
        this.context = RuntimeContext.getInstance()
        this.vault = new VaultService()
    }

    public async progressMediaData(newPostText: string, newImagesBase64: string[], newVideoData: VideoData) {
        const mediaData = await this.prepareMediaData(newImagesBase64, newVideoData)
        let mediaType = MediaType.noMeida
        if (newImagesBase64 === null && newVideoData === null) {
            mediaType = MediaType.noMeida
        }
        else if (newImagesBase64.length > 0 && newImagesBase64[0] != null && newImagesBase64[0] != '') {
            mediaType = MediaType.containsImg
        } else if (newVideoData) {
            mediaType = MediaType.containsVideo
        }
        const content = this.preparePublishPostContent(newPostText, mediaData, mediaType)

        return content
    }

    async prepareMediaData(imagesBase64: string[], videoData: VideoData): Promise<MediaData[]> {
        try {
            const mediaDatas: MediaData[] = await this.processUploadMeidas(imagesBase64, videoData)
            return mediaDatas
        } catch (error) {
            const errorMsg = 'Prepare publish post error'
            logger.error(errorMsg, error)
            throw error
        }
    }

    preparePublishPostContent(postText: string, mediaData: MediaData[], mediaType: MediaType): PostContent {
        const content = new PostContent("3.0", postText, mediaData, mediaType)
        return content
    }

    async processUploadMeidas(imagesBase64: string[], videoData: VideoData): Promise<MediaData[]> {
        try {
            if (imagesBase64 === null && videoData === null) {
                return []
            }
            let mediasData: MediaData[] = []
            if (imagesBase64.length > 0 && imagesBase64[0] != null && imagesBase64[0] != '') {
                for (let index = 0; index < imagesBase64.length; index++) {
                    const element = imagesBase64[index]
                    if (!element || element == '')
                        continue

                    const elementBlob = this.base64ToBlob(element)
                    const originMediaData = await this.uploadDataToHiveWithString(element, elementBlob.type)

                    const thumbnail = await utils.compress(element)
                    const thumbnailBlob = this.base64ToBlob(thumbnail)
                    const thumbnailMediaData = await this.uploadDataToHiveWithString(thumbnail, thumbnailBlob.type)

                    if (originMediaData && thumbnailMediaData) {
                        const mediaData = this.createMediaData("image", originMediaData.getMedaPath(), originMediaData.getType(), originMediaData.getSize(), thumbnailMediaData.getMedaPath(), 0, 0, {}, {})
                        mediasData.push(mediaData)
                    }
                }
            }

            // process Video data
            if (videoData) {
                const videoBlob = this.base64ToBlob(videoData.getVideo())
                const originMediaData = await this.uploadDataToHiveWithString(videoData.getVideo(), videoBlob.type)

                const videoThumbBlob = this.base64ToBlob(videoData.getThumbnail())
                const thumbnailMediaData = await this.uploadDataToHiveWithString(videoData.getThumbnail(), videoThumbBlob.type)

                if (originMediaData && thumbnailMediaData) {
                    const mediaData = this.createMediaData("video", originMediaData.getMedaPath(), originMediaData.getType(), originMediaData.getSize(), thumbnailMediaData.getMedaPath(), videoData.getDuration(), 0, {}, {})
                    mediasData.push(mediaData)
                }
            }
            return mediasData
        } catch (error) {

            const errorMsg = 'Upload medias error'
            logger.error(errorMsg, error)
            throw error
        }
    }

    async uploadDataToHiveWithString(elementBlob: string, type: string): Promise<OriginMediaData> {
        try {
            const size = elementBlob.length
            const path = await this.uploadMediaDataWithString(elementBlob)
            const data = {
                size: size,
                type: type,
                path: path
            }
            const originMediaData = OriginMediaData.parse(data)
            return originMediaData
        } catch (error) {
            const errorMsg = 'Upload data to hive error'
            logger.error(errorMsg, error)
            throw error
        }
    }

    async uploadMediaDataWithString(data: string): Promise<string> {
        try {
            const hash = SparkMD5.hash(data)

            const remoteName = 'feeds/data/' + hash
            await this.vault.uploadScriptWithString(remoteName, data)
            const scriptName = hash
            await this.vault.registerFileDownloadScripting(scriptName)
            let avatarHiveURL = scriptName + "@" + remoteName //
            logger.log("Generated avatar url:", avatarHiveURL)
            return avatarHiveURL
        } catch (error) {
            throw error
        }
    }

    base64ToBlob(base64Data: string): Blob {
        if (!base64Data && base64Data == '') {
            logger.error('Base64 data to blob error, input is null')
            return null
        }
        return utils.base64ToBlob(base64Data)
    }

    createMediaData(kind: string, originMediaPath: string, type: string, size: number, thumbnailPath: string, duration: number, index: number, additionalInfo: any, memo: any): MediaData {
        const data = {
            kind: kind,
            originMediaPath: originMediaPath,
            type: type,
            size: size,
            imageIndex: index,
            thumbnailPath: thumbnailPath,
            duration: duration,
            additionalInfo: additionalInfo,
            memo: memo
        }
        const mediaData = MediaData.parse(data)
        return mediaData
    }
}
