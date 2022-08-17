import { Logger } from './utils/logger'
import { IllegalArgumentException } from "./Exception"
const logger = new Logger("AppContext")

export class AppContext {
    private static instance: AppContext = null

    userDid = ''
    applicationDID = ''
    currentNet = ''
    resolverCache = ''

    private constructor(userDid: string, applicationDID: string, currentNet: string, resolverCache: string) {
        this.userDid = userDid
        this.applicationDID = applicationDID
        this.currentNet = currentNet
        this.resolverCache = resolverCache
    }

    public static initialize(
        userDid: string,
        applicationDid: string,
        currentNet: string,
        resolverCache: string
    ) {
        if (userDid === null || userDid === '') {
            logger.error("userDid is null .")
            throw new IllegalArgumentException("userDid cannot be empty")
        }
        if (applicationDid === null || applicationDid === '') {
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

        this.instance = new AppContext(userDid, applicationDid,
            currentNet, resolverCache)
    }

    public static getInstance(): AppContext {
        if (this.instance == null) {
            throw new IllegalArgumentException("The AppContext was not initialized. Please call AppContext.initialize(userDid, applicationDid, currentNet, resolverCache)")
        }
        return this.instance
    }

    public static isInitialized(): boolean {
        return this.instance !== null
    }
}
