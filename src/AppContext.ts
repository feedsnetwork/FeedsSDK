import { Logger } from './utils/logger'
import { IllegalArgumentException } from "./Exception"
const logger = new Logger("AppContext")

export class AppContext {
    userDid = ''
    applicationDID = ''
    currentNet = ''
    resolverCache = ''

    private constructor(userDid: string, applicationDID: string, currentNet: string, resolverCache: string) {
        
        if (userDid === null || userDid === '') {
            logger.error("userDid is null .")
            throw new IllegalArgumentException("userDid cannot be empty")
        }
        if (applicationDID === null || applicationDID === '') {
            logger.error("applicationDID is null .")
            throw new IllegalArgumentException("applicationDID cannot be empty")
        }
        if (currentNet === null || currentNet === '') {
            logger.error("currentNet is null .")
            throw new IllegalArgumentException("currentNet cannot be empty")
        }
        if (resolverCache === null || resolverCache === '') {
            logger.error("resolverCache is null .")
            throw new IllegalArgumentException("resolverCache cannot be empty")
        }
        this.userDid = userDid
        this.applicationDID = applicationDID
        this.currentNet = currentNet
        this.resolverCache = resolverCache
    }
}
