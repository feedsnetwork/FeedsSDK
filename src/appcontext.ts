import { Logger } from './utils/logger'
import { IllegalArgumentException } from "./exceptions/Exception"

const logger = new Logger("AppContext")

export class AppContext {
    private static sInstance: AppContext = null

    private readonly applicationDid: string = "FEEDS-APPDID"
    private readonly network: string

    private constructor(network: string) {
        this.network = network
    }

    public getAppDid(): string {
        return this.applicationDid
    }

    public static initialize(currentNet: string) {
        if (currentNet === null || currentNet === '') {
            logger.error("currentNet is null .")
            throw new IllegalArgumentException("currentNet cannot be empty")
        }

        this.sInstance = new AppContext(currentNet)
    }

    public static getInstance(): AppContext {
        if (this.sInstance == null) {
            throw new IllegalArgumentException("The AppContext was not initialized. Please call AppContext.initialize(applicationDid, currentNet)")
        }
        return this.sInstance
    }

    public static isInitialized(): boolean {
        return this.sInstance !== null
    }
}
