import { Logger } from './utils/logger'
import { Logger as HiveLogger } from '@elastosfoundation/hive-js-sdk'
import { Vault, ScriptRunner, AppContext as HiveContext, AppContextProvider as HiveContextProvider } from '@elastosfoundation/hive-js-sdk'
import { prepreFeedsVault } from './provision'
const logger = new Logger("AppContext")

export class RuntimeContext {
    private static sInstance: RuntimeContext = null

    private scriptRunners: { [key: string]: ScriptRunner } = {}
    private vault: Vault = null

    private applicationDid = ""

    private userDid: string
    private hiveContext: HiveContext
    private hiveContextProvider: HiveContextProvider

    private constructor(hiveContextProvider: HiveContextProvider, userDid: string) {
        this.applicationDid = "did:elastos:iqtWRVjz7gsYhyuQEb1hYNNmWQt1Z9geXg" // Should be Feeds application DID.
        this.hiveContextProvider = hiveContextProvider;
        this.userDid = userDid;
    }

    public getAppDid(): string {
        return this.applicationDid
    }

    public setUserDid(userDid: string) {
        this.userDid = userDid
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
        didResolver: string,
        userDid: string) {

        if (this.sInstance != null) {
            throw new Error("RuntimeContext singleton has been initalized already, please call AppConctxt.getInstance() to use it");
        }

        try {
            this.sInstance = new RuntimeContext(hiveContextProvider, userDid)
            //HiveLogger.setLevel(HiveLogger.TRACE)
            HiveContext.setupResolver(
                didResolver,
                hiveContextProvider.getLocalDataDir() + ".didCache"
            )

            logger.info("Ignore: RuntimeContxt singleton has been initalized.")
        } catch (error) {
            logger.info(`RuntimeContext singleton initalized error: ${error}`)
        }
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

/*
    private async getAppInstanceDIDDocument() {
        if (this.appInstanceDIDDocument === null || this.appInstanceDIDDocument === undefined) {
            const didAccess = new ConDID.DIDAccess()
            const info = await didAccess.getOrCreateAppInstanceDID()
            const instanceDIDDocument = await info.didStore.loadDid(info.did.toString())
            this.appInstanceDIDDocument = instanceDIDDocument
        }

        return this.appInstanceDIDDocument
    }

    private async generateHiveAuthPresentationJWT(challenge: string) {

        try {
            // Parse this challenge code to be claims.
            let parsed = await new JWTParserBuilder().build().parse(challenge)
            let claims = parsed.getBody()
            if (claims == null) {
                throw new Error(`Invalid challenge code. ${challenge}`)
            }

            // abstract issuer/nonce from claims that will be used next.
            let payload = claims.getJWTPayload()
            let nonce   = payload['nonce'] as string
            let issuer  = claims.getIssuer()

            //x Issue VC to appInstanceDid to access Hive/Vault
            connectivity.setApplicationDID(this.getAppDid())
            let didAccess = new ConDID.DIDAccess()
            let vc = await didAccess.getExistingAppIdentityCredential()
            if (vc != null) {
                vc = await didAccess.generateAppIdCredential()
            }

            // Create VP from VC with appInstanceDid as subject

            let info = await didAccess.getOrCreateAppInstanceDID()
            let info2 = await didAccess.getExistingAppInstanceDIDInfo()
            let builder = await VerifiablePresentation.createFor(info.did, null, info.didStore)
            let vp = await builder.credentials(vc)
                .realm(issuer)
                .nonce(nonce)
                .seal(info2.storePassword)

            // Wrapper vp to be jwtcode
            const exp = new Date()
            const iat = new Date().getTime()
            exp.setFullYear(exp.getFullYear() + 2)
            const expTime = exp.getTime()

            // Create JWT token with presentation.
            let doc = await this.getAppInstanceDIDDocument()
            return await doc.jwtBuilder()
                .addHeader(JWTHeader.TYPE, JWTHeader.JWT_TYPE)
                .addHeader("version", "1.0")
                .setSubject("DIDAuthResponse")
                .setAudience(issuer)
                .setIssuedAt(iat)
                .setExpiration(expTime)
                .claimsWithJson("presentation", vp.toString(true))
                .sign(info2.storePassword)
        } catch (error) {
            throw new Error(`Generating response jwtcode error: ${error}`)
        }
    }
*/
    private async getHiveContext(): Promise<HiveContext> {
        try {
            if (this.hiveContext == null) {
                this.hiveContext = await HiveContext.build(this.hiveContextProvider, this.userDid,  this.applicationDid)
            }
            return await Promise.resolve(this.hiveContext);
        } catch (error) {
            throw new Error(`Build HiveContext instance error: ${error}`)
        }
    }

    public async getScriptRunner(targetDid: string): Promise<ScriptRunner> {
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

    public async getVault(): Promise<Vault> {
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

