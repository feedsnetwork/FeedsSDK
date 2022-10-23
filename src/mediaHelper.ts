import { RuntimeContext } from './runtimecontext'
import { Logger } from './utils/logger'
import { MediaType, VideoData, MediaData, PostContent, OriginMediaData } from './postbody'
import { utils } from "./utils/utils"
import SparkMD5 from 'spark-md5'
import { FileDownloadExecutable, Vault } from '@elastosfoundation/hive-js-sdk/typings'

const logger = new Logger("MediaHelper")

const isValidImageBas64 = (base64: string[]): boolean => {
    return (base64.length > 0 && base64[0] != null && base64[0] != '');
}

export class MediaHelper {
    private context: RuntimeContext

    public constructor() {
        this.context = RuntimeContext.getInstance()
    }

    public async progressMediaData(newPostText: string, newImagesBase64: string[], newVideoData: VideoData) {
        let mediaType: MediaType;

        if (isValidImageBas64(newImagesBase64)) {
            mediaType = MediaType.containsImg
        } else if (newVideoData) {
            mediaType = MediaType.containsVideo
        } else {
            mediaType = MediaType.noMeida
        }

        const mediaData = await this.processUploadMeidas(newImagesBase64, newVideoData)
        return new PostContent("3.0", newPostText, mediaData, mediaType)
    }



    private async processUploadMeidas(imagesBase64: string[], videoData: VideoData): Promise<MediaData[]> {
        try {
            if (imagesBase64 === null && videoData === null)
                return []

            let mediasData: MediaData[] = []
            if (isValidImageBas64(imagesBase64)) {
                for (let index = 0; index < imagesBase64.length; index++) {
                    let element = imagesBase64[index]
                    if (!element || element == '')
                        continue

                    let originalBlob = utils.base64ToBlob(element)
                    const originalMediaData = await this.uploadMediadataToVault(element, originalBlob.type)

                    let thumbnail = await utils.compress(element)
                    let thumbnailBlob = utils.base64ToBlob(thumbnail)
                    let thumbnailMediaData = await this.uploadMediadataToVault(thumbnail, thumbnailBlob.type)

                    if (originalMediaData && thumbnailMediaData) {
                        let mediaData = MediaData.parse({
                            kind: "image",
                            originMediaPath: originalMediaData.getMedaPath(),
                            type: originalMediaData.getType(),
                            size: originalMediaData.getSize(),
                            imageIndex: 0,
                            thumbnailPath: thumbnailMediaData.getMedaPath(),
                            duration: videoData.getDuration(),
                            additionalInfo: {},
                            memo: {}
                        })
                        mediasData.push(mediaData)
                    }
                }
            }

            // process Video data
            if (videoData && videoData.getVideo != null && videoData.getVideo() !== '') {
                let originalBlob = utils.base64ToBlob(videoData.getVideo())
                let originalMediaData = await this.uploadMediadataToVault(videoData.getVideo(), originalBlob.type)

                let videoThumbBlob = utils.base64ToBlob(videoData.getThumbnail())
                let thumbnailMediaData = await this.uploadMediadataToVault(videoData.getThumbnail(), videoThumbBlob.type)

                if (originalMediaData && thumbnailMediaData) {
                    let mediaData = MediaData.parse({
                        kind: "video",
                        originMediaPath: originalMediaData.getMedaPath(),
                        type: originalMediaData.getType(),
                        size: originalMediaData.getSize(),
                        imageIndex: 0,
                        thumbnailPath: thumbnailMediaData.getMedaPath(),
                        duration: videoData.getDuration(),
                        additionalInfo: {},
                        memo: {}
                    })
                    mediasData.push(mediaData)
                }
            }
            return mediasData

        } catch (error) {
            logger.error(`Upload medias error: ${error}`)
            throw error
        }
    }

    private async uploadMediadataToVault(mediaData: string, type: string): Promise<OriginMediaData> {
        try {
            let vault = await this.context.getVault()
            return OriginMediaData.parse({
                size: mediaData.length,
                type: type,
                path: await this.uploadMediaDataAndReturnPath(vault, mediaData)
            })
        } catch (error) {
            logger.error(`Upload media data to hive/vault error: ${error}`)
            throw error
        }
    }

    private async uploadMediaDataAndReturnPath(vault: Vault, mediaData: string): Promise<string> {
        // try {
            let hash = SparkMD5.hash(mediaData)

            let remoteName = 'feeds/data/' + hash
            await vault.getFilesService().upload('feeds/data/' + hash, Buffer.from(mediaData, 'utf8'))

            const scriptName = hash
            const executable = new FileDownloadExecutable(scriptName).setOutput(true);
            await vault.getScriptingService().registerScript(scriptName, executable, null, false)

            let avatarHiveURL = scriptName + "@" + remoteName //
            logger.log("Generated avatar url:", avatarHiveURL)
            return avatarHiveURL
        //} catch (error) {
        //    throw error
        //}
    }
}
