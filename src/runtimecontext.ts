import { JWTHeader, JWTParserBuilder, Logger as HiveLogger, DIDDocument, DIDBackend, DefaultDIDAdapter, VerifiablePresentation } from '@elastosfoundation/did-js-sdk'
import { Logger } from './utils/logger'
import { signin, signout, checkSignin } from './signin'
import { Vault, AppContext, ScriptRunner } from '@elastosfoundation/hive-js-sdk/typings'
import { connectivity, DID as ConDID, Hive } from "@elastosfoundation/elastos-connectivity-sdk-js"
import { Register } from './register'
const logger = new Logger("AppContext")

export class RuntimeContext {
    private static sInstance: RuntimeContext = null
    private scriptRunners: { [key: string]: ScriptRunner } = {}
    private register: Register

    private applicationDid = "did:elastos:iXyYFboFAd2d9VmfqSvppqg1XQxBtX9ea2"
    private networkType: string

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
        return this.applicationDid
    }

    public setUserDid(userDid: string) {
        this.userDid = userDid
    }

    public getUserDid(): string {
        return this.userDid
    }

    public getNetwork(): string {
        return this.networkType
    }

    public getAppInstanceDIDDocument(): string {
        return this.appInstanceDIDDocument
    }

    public getScriptRunners(userDid: string): ScriptRunner {
        return this.scriptRunners[userDid]
    }

    public static initialize(applicationDid: string, networkType: string, localDataDir: string, resolveCache: string) {
        DIDBackend.initialize(new DefaultDIDAdapter(networkType))
        AppContext.setupResolver(networkType, resolveCache)
        HiveLogger.setLevel(HiveLogger.DEBUG)
        this.sInstance = new RuntimeContext(applicationDid, networkType, localDataDir, resolveCache)
        logger.info(`Initalized DIDBackend with resolver URL: ${networkType}`)
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

    public signin() {
        return signin(this)
    }

    public signout() {
        return signout()
    }

    public checkSignin() {
        return checkSignin()
    }
    
    public signHive(): Promise<boolean> {
        return this.register.prepareConnectHive().then(_ => {
            return this.register.checkCreateAndRregiste(true) // 注册 创建
        }).then(_ => {
            return true
        }).catch((error) => {
            logger.error("Sign hive error: ", error)
            throw error
        })
    }

    public signIntoVault(userDid: string, appInstanceDIDDocument: DIDDocument): Promise<AppContext> {
        let self = this
        return AppContext.build({
            getLocalDataDir: (): string => this.getLocalDataDir(),
            getAppInstanceDocument: (): Promise<DIDDocument> => Promise.resolve(appInstanceDIDDocument),
            getAuthorization: (jwtToken: string): Promise<string> => {
                return new Promise((resolve, reject) => {
                    try {
                        const authToken = self.generateHiveAuthPresentationJWT(jwtToken)
                        resolve(authToken)
                    } catch (error) {
                        logger.error("Generate hive auth presentation JWT error: ", error)
                        reject(error)
                    }
                })
            }
        }, userDid, this.getAppDid()).then((context) => {
            return context
        }).catch((error) => {
            logger.error("Build HiveContext error: ", error)
            throw error
        })
    }

    async getAppInstanceDIDDoc() {
        const didAccess = new ConDID.DIDAccess()
        const info = await didAccess.getOrCreateAppInstanceDID()
        const instanceDIDDocument = await info.didStore.loadDid(info.did.toString())
        return instanceDIDDocument
    }

    async issueDiplomaFor() {
        const applicationDID = RuntimeContext.getInstance().getAppDid()
        connectivity.setApplicationDID(applicationDID)
        const didAccess = new ConDID.DIDAccess()
        let credential = await didAccess.getExistingAppIdentityCredential()
        if (credential) {
            return credential
        }
        credential = await didAccess.generateAppIdCredential()
        if (credential) {
            return credential
        }
    }

    async createPresentation(vc, hiveDid, nonce) {
        const access = new ConDID.DIDAccess()
        const info = await access.getOrCreateAppInstanceDID()
        const info2 = await access.getExistingAppInstanceDIDInfo()
        const vpb = await VerifiablePresentation.createFor(info.did, null, info.didStore)
        const vp = await vpb.credentials(vc).realm(hiveDid).nonce(nonce).seal(info2.storePassword)
        return vp
    }

    async generateHiveAuthPresentationJWT(challeng: string) {

        if (challeng === null || challeng === undefined || challeng === '') {
            console.log('Params error')
            // throw error // todo
        }

        // Parse, but verify on chain that this JWT is valid first
        const JWTParser = new JWTParserBuilder().build()
        const parseResult = await JWTParser.parse(challeng)
        const claims = parseResult.getBody()
        if (claims === undefined) {
            return // 抛出error
        }
        const payload = claims.getJWTPayload()
        const nonce = payload['nonce'] as string
        const hiveDid = claims.getIssuer()
        const appIdCredential = await this.issueDiplomaFor()
        const presentation = await this.createPresentation(appIdCredential, hiveDid, nonce)
        const token = await this.createChallengeResponse(presentation, hiveDid)

        return token
    }

    async createChallengeResponse(vp, hiveDid) {
        const exp = new Date()
        const iat = new Date().getTime()
        exp.setFullYear(exp.getFullYear() + 2)
        const expTime = exp.getTime()

        // Create JWT token with presentation.
        const doc = await this.getAppInstanceDIDDoc()
        const info = await new ConDID.DIDAccess().getExistingAppInstanceDIDInfo()
        const token = await doc.jwtBuilder()
            .addHeader(JWTHeader.TYPE, JWTHeader.JWT_TYPE)
            .addHeader("version", "1.0")
            .setSubject("DIDAuthResponse")
            .setAudience(hiveDid)
            .setIssuedAt(iat)
            .setExpiration(expTime)
            .claimsWithJson("presentation", vp.toString(true))
            .sign(info.storePassword)
        return token
    }

    async creatScriptRunner(targetDid: string) {
        const appinstanceDocument = await this.getAppInstanceDIDDoc()
        const context = await this.signIntoVault(targetDid, appinstanceDocument)
        const scriptRunner = new ScriptRunner(context)
        this.scriptRunners[targetDid] = scriptRunner

        return scriptRunner
    }

    async createVault() {
        try {
            const userDid = RuntimeContext.getInstance().getUserDid()
            const appinstanceDocument = await this.getAppInstanceDIDDoc()
            const context = await this.signIntoVault(userDid, appinstanceDocument)
            const hiveVault = new Vault(context)
            const scriptRunner = await this.creatScriptRunner(userDid)
            this.scriptRunners[userDid] = scriptRunner

            return hiveVault
        }
        catch (error) {
            logger.error('Create vault error:', error)
            throw error
        }
    }
}

