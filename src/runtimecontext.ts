import { DIDBackend, DefaultDIDAdapter } from '@elastosfoundation/did-js-sdk';
import { Logger } from './utils/logger'

const logger = new Logger("AppContext")

export class RuntimeContext {
    private static sInstance: RuntimeContext = null

    private applicationDid = "did:elastos:iXyYFboFAd2d9VmfqSvppqg1XQxBtX9ea2";
    private networkType: string;

    private readonly resolveCache: string
    private readonly localDataDir: string 
    private readonly appInstanceDIDDocument: string // todo
    private userDid: string 

    private constructor(applicationDid: string, networkType: string, localDataDir: string, resolveCache: string) {
        this.applicationDid = applicationDid
        this.networkType = networkType
        this.localDataDir = localDataDir
        this.resolveCache = resolveCache
    }

    public getAppDid(): string {
        return this.applicationDid;
    }

    public setUserDid(userDid: string) {
        this.userDid = userDid
    }

    public getUserDid(): string {
        return this.userDid;
    }

    public getNetwork(): string {
        return this.networkType;
    }

    public getAppInstanceDIDDocument(): string {
        return this.appInstanceDIDDocument
    }

    public static initialize(applicationDid: string, networkType: string, localDataDir: string, resolveCache: string) {
        // DIDBackend.initialize(new DefaultDIDAdapter(didResolver));
        this.sInstance = new RuntimeContext(applicationDid, networkType, localDataDir, resolveCache)
        logger.info(`Initalized DIDBackend with resolver URL: ${networkType}`);
    }

    public static getInstance(): RuntimeContext {
        if (this.sInstance == null) {
            throw new Error("The AppContext was not initialized. Please call AppContext.initialize(applicationDid, currentNet)")
        }
        return this.sInstance
    }

    public static isInitialized(): boolean {
        return this.sInstance !== null
    }

    public getResolveCache(): string {
        return this.resolveCache
    }

    public getLocalDataDir(): string {
        return this.localDataDir
    }
}
