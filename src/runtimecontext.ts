import { Logger } from './utils/logger'
import { DIDResolverAlreadySetupException, Logger as HiveLogger } from '@elastosfoundation/hive-js-sdk'
import { Vault, ScriptRunner, AppContext as HiveContext, AppContextProvider as HiveContextProvider } from '@elastosfoundation/hive-js-sdk'
import { prepreFeedsVault } from './provision'
const logger = new Logger("AppContext")

export class RuntimeContext {
    private static sInstance: RuntimeContext = null

    private scriptRunners: { [key: string]: ScriptRunner } = {}
    private vault: Vault = null

    private applicationDid = "did:elastos:iqtWRVjz7gsYhyuQEb1hYNNmWQt1Z9geXg" // Should be Feeds application DID.

    private userDid: string
    private hiveContext: HiveContext
    private hiveContextProvider: HiveContextProvider

    private constructor(hiveContextProvider: HiveContextProvider, userDid: string) {
        this.hiveContextProvider = hiveContextProvider;
        this.userDid = userDid;
    }

    public getAppDid(): string {
        return this.applicationDid
    }

    public getUserDid(): string {
        return this.userDid
    }

    // Get the path to store the hive local cache
    public getLocalDataDir(): string {
        return this.hiveContextProvider.getLocalDataDir()
    }

    /**
     * Initalize RuntimeContext singleton.
     * @param didResolver DID resolver that be shortcut name: [testnet | mainnet]
     */
    public static createInstance(
        hiveContextProvider: HiveContextProvider,
        userDid: string,
        didResolver = "mainnet") {

        if (this.sInstance != null) {
            throw new Error("RuntimeContext singleton has been initalized already, please call AppConctxt.getInstance() to use it");
        }

        if (!hiveContextProvider || !userDid) {
            throw new Error("Parameters hiveContextProvider and userDid should be both with value")
        }

        try {
            this.sInstance = new RuntimeContext(hiveContextProvider, userDid)
            //HiveLogger.setLevel(HiveLogger.TRACE)
            HiveContext.setupResolver(
                didResolver ? didResolver : "testnet",
                hiveContextProvider.getLocalDataDir() + ".didCache"
            )
        } catch (error) {
            if(error !instanceof DIDResolverAlreadySetupException) {
                logger.info(`RuntimeContext singleton initalized error: ${error}`)
            }
        }
        logger.info("Ignore: RuntimeContxt singleton has been initalized.")
    }

    // Get RuntimeContext instance
    public static getInstance(): RuntimeContext {
        if (this.sInstance == null) {
            throw new Error("The RuntimeContext was not initialized. Please call AppContext.initializeInstance methods to initialize it.")
        }
        return this.sInstance
    }

    // Whether the RuntimeContext is initialized
    public static isInitialized(): boolean {
        return this.sInstance !== null
    }

    public async prepareFeedsVault() {
        return await prepreFeedsVault(await this.getVault(), this.getUserDid(), true)
    }

    private async getHiveContext(): Promise<HiveContext> {
        try {
            if (this.hiveContext == null) {
                this.hiveContext = await HiveContext.build(this.hiveContextProvider, this.userDid,  this.applicationDid)
            }
            return this.hiveContext;
        } catch (error) {
            throw new Error(`Build HiveContext instance error: ${error}`)
        }
    }

    async getScriptRunner(targetDid: string): Promise<ScriptRunner> {
        if (!targetDid || targetDid === "") {
            throw new Error("Parmater targetDid is invalid")
        }

        if (this.scriptRunners[targetDid] != null)
            return this.scriptRunners[targetDid]

        try {
            let scriptRunner = new ScriptRunner(
                await this.getHiveContext(),
                await HiveContext.getProviderAddressByUserDid(targetDid)
            )
            this.scriptRunners[targetDid] = scriptRunner
            return scriptRunner
        } catch (error) {
            logger.error(`Got a scriptRunner object for ${targetDid} error: ${error}`);
            throw new Error(error);
        }
    }

    async getVault(): Promise<Vault> {
        if (this.vault != null)
            return this.vault;

        try {
            this.vault = new Vault(await this.getHiveContext())
            return this.vault
        } catch (error) {
            logger.error(`Get vault object for ${this.userDid} error ${error}`);
            throw new Error(error);
        }
    }
}

