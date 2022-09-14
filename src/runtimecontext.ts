import { DIDBackend, DefaultDIDAdapter, DIDDocument } from '@elastosfoundation/did-js-sdk';
import { AppContext } from '@elastosfoundation/hive-js-sdk';
import { MyProfile } from './myprofile';
import { checkSignin, signin, signout } from './signin';
import { Logger } from './utils/logger'

const logger = new Logger("RuntimeContext")

export const getFeedsAppDid = (): string => {
    return "did:elastos:iXyYFboFAd2d9VmfqSvppqg1XQxBtX9ea2";
}

export class RuntimeContext {
    [x: string]: any;
    private static sInstance: RuntimeContext = null

    private hiveContext: AppContext;
    private networkType: string;
    private resolveCache: string
    private localDataDir: string
    private appInstanceDIDDocument: string;
    private userDid: string;

    private constructor(network: string, resolveCache: string, dataPath: string) {
        this.networkType  = network;
        this.resolveCache = resolveCache;
        this.localDataDir = dataPath;
    }

    public getAppDid(): string {
        return getFeedsAppDid();
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

    public static initialize1(network: string, cachePath: string, dataPath: string ) {
        try {
            DIDBackend.initialize(new DefaultDIDAdapter(network.toLowerCase()));
            AppContext.setupResolver(network.toLowerCase(), cachePath)
            Logger.setDefaultLevel(Logger.TRACE)

            this.sInstance = new RuntimeContext(network, cachePath, dataPath);
        } catch (error) {
            logger.error(error);
            throw new Error(error);
        }
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

    public signin(): Promise<MyProfile> {
        return signin(this);
    }

    public signout(): Promise<void> {
        return signout();
    }

    public checkSignin(): boolean {
        return checkSignin();
    }

    public signIntoVault(userDid: string, appInstanceDIDDocument: DIDDocument): Promise<void> {
        return AppContext.build({
            getLocalDataDir: (): string => this.getLocalDataDir(),
            getAppInstanceDocument: (): Promise<DIDDocument> => Promise.resolve(appInstanceDIDDocument),
            getAuthorization: (jwtToken: string): Promise<string> => {
              return new Promise((resolve, reject) => {
                try {
                  const authToken = this.generateHiveAuthPresentationJWT(jwtToken)
                  resolve(authToken)
                } catch (error) {
                  logger.error("get Authorization Error: ", error)
                  reject(error)
                }
              })
            }
        }, userDid, this.getAppDid()).then((context) => {
            this.hiveContext = context;
        }).catch ((error) => {
            logger.error("Build HiveContext error: ", error);
            throw new Error(error);
        })
    }

    public getResolveCache(): string {
        return this.resolveCache
    }

    public getLocalDataDir(): string {
        return this.localDataDir
    }
}
