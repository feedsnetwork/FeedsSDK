//import { Logger } from './utils/logger'

//const logger = new Logger("AppContext")

export class AppContext {
    //private static sInstance: AppContext = null

    private readonly applicationDid: string = "FEEDS-APPDID";
    private readonly network: string
    private readonly resolveCache: string // todo
    private readonly localDataDir: string // todo
    private readonly appInstanceDIDDocument: string // todo
    private readonly userDid: string // todo

    private constructor(network: string) {
        this.network = network
    }

    public getAppDid(): string {
        return this.applicationDid
    }

    public getUserDid(): string {
        return this.userDid
    }

    public getApplicationDid(): string {
        return this.applicationDid
    }

    public getAppInstanceDIDDocument(): string {
        return this.appInstanceDIDDocument
    }

    /*
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
    } */

    public getNetwork(): string {
        return this.network
    }

    public getResolveCache(): string {
        return this.resolveCache
    }

    public getLocalDataDir(): string {
        return this.localDataDir
    }

}
