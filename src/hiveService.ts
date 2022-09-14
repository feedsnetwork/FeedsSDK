import { Executable, InsertOptions, File as HiveFile, ScriptRunner, Vault, AppContext, Logger as HiveLogger, UpdateResult, UpdateOptions, Condition, InsertResult, DatabaseService, ScriptingService, FilesService } from "@elastosfoundation/hive-js-sdk"
import { Claims, DIDDocument, JWTHeader, JWTParserBuilder, DID, DIDBackend, DefaultDIDAdapter, JSONObject, VerifiablePresentation } from '@elastosfoundation/did-js-sdk'
import { connectivity, DID as ConDID, Hive } from "@elastosfoundation/elastos-connectivity-sdk-js"
import { Logger } from './utils/logger'
import { AppContext as FeedsAppContext } from './appcontext'

const logger = new Logger("Channel")
export class hiveService {
  private vault: Vault
  private scriptRunner: ScriptRunner // TODO:
  private scriptRunners: { [key: string]: ScriptRunner } = {}

  constructor() { }

  public async creatAppContext(appInstanceDocument, userDidString: string): Promise<AppContext> {
    return new Promise(async (resolve, reject) => {
      try {
        const currentNet = "mainnet".toLowerCase();
        HiveLogger.setDefaultLevel(HiveLogger.TRACE)

        console.log("setupResolver userDidString ========================= 0-1", userDidString)
        console.log("setupResolver currentNet ========================= 0-2", currentNet)

        DIDBackend.initialize(new DefaultDIDAdapter(currentNet))
        try {
          console.log("setupResolver ======================== 1")
          const resolverCatch = FeedsAppContext.getInstance().getResolveCache()
          AppContext.setupResolver(currentNet, resolverCatch)
          console.log("setupResolver ======================== 2")
        } catch (error) {
          console.log("setupResolver error: ", error)
        }
        const path = FeedsAppContext.getInstance().getLocalDataDir()
        const applicationDID = FeedsAppContext.getInstance().getAppDid()
        // auth
        const context = await AppContext.build({
          getLocalDataDir(): string {
            return path
          },
          getAppInstanceDocument(): Promise<DIDDocument> {
            return new Promise(async (resolve, reject) => {
              try {
                resolve(appInstanceDocument)
              } catch (error) {
                reject(error)
              }
            })
          },
          getAuthorization(jwtToken: string): Promise<string> {
            return new Promise(async (resolve, reject) => {
              try {
                const authToken = this.generateHiveAuthPresentationJWT(jwtToken)
                resolve(authToken)
              } catch (error) {
                console.log("get Authorization Error: ", error)
                logger.error("get Authorization Error: ", error)
                reject(error)
              }
            })
          }
        }, userDidString, applicationDID)
        resolve(context)
      } catch (error) {
        console.log("creat context Error: ", error)
        logger.error("creat context Error: ", error)
        reject(error)
      }
    })
  }

  generateHiveAuthPresentationJWT = async (challeng) => {
    if (challeng === null || challeng === undefined || challeng === '') {
      console.log('Params error')
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

  async getAppInstanceDIDDoc() {
    const didAccess = new ConDID.DIDAccess()
    const info = await didAccess.getOrCreateAppInstanceDID()
    const instanceDIDDocument = await info.didStore.loadDid(info.did.toString())
    console.log("instanceDIDDocument ======= ", instanceDIDDocument)
    return instanceDIDDocument
  }

  async issueDiplomaFor() {
    const applicationDID = FeedsAppContext.getInstance().getAppDid()
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
      .sign(info.storePassword);
    return token
  }

  async creatScriptRunner(targetDid: string) {
    const appinstanceDocument = await this.getAppInstanceDIDDoc()
    const context = await this.creatAppContext(appinstanceDocument, targetDid)
    const scriptRunner = new ScriptRunner(context)
    this.scriptRunners[targetDid] = scriptRunner

    return scriptRunner
  }

  async createVault() {
    try {
      const userDid = FeedsAppContext.getInstance().getUserDid()
      const appinstanceDocument = await this.getAppInstanceDIDDoc()
      const context = await this.creatAppContext(appinstanceDocument, userDid)
      const hiveVault = new Vault(context)
      const scriptRunner = await this.creatScriptRunner(userDid)
      this.scriptRunners[userDid] = scriptRunner

      return hiveVault
    }
    catch (error) {
      logger.error('Create vault error:', error)
      console.log('Create vault error:', error)
      throw error
    }
  }

  async getScriptRunner(userDid: string): Promise<ScriptRunner> {
    try {
      this.scriptRunner = this.scriptRunners[userDid]

      if (this.scriptRunner === undefined || this.scriptRunner === null) {
        this.scriptRunner = await this.creatScriptRunner(userDid)
      }
      return this.scriptRunner
    } catch (error) {
      throw error
    }

  }

  async getVault(): Promise<Vault> {
    if (this.vault === undefined || this.vault === null) {
      this.vault = await this.createVault()
    }
    return this.vault
  }

  async getDatabaseService() {
    return (await this.getVault()).getDatabaseService()
  }

  async getFilesService() {
    return (await this.getVault()).getFilesService()
  }

  async getScriptingService() {
    return (await this.getVault()).getScriptingService()
  }

  async createCollection(channelName: string): Promise<void> {
    return (await this.getDatabaseService()).createCollection(channelName)
  }

  async deleteCollection(collectionName: string): Promise<void> {
    return (await this.getDatabaseService()).deleteCollection(collectionName);
  }

  async registerScript(scriptName: string, executable: Executable, condition?: Condition, allowAnonymousUser?: boolean, allowAnonymousApp?: boolean): Promise<void> {
    return (await this.getScriptingService()).registerScript(scriptName, executable,
      condition, allowAnonymousUser, allowAnonymousApp)
  }

  async callScript(scriptName: string, document: any, targetDid: string, appid: string): Promise<any> {
    return this.scriptRunner.callScript<any>(scriptName, document, targetDid, appid)
  }

  uploadScriting(transactionId: string, data: string): Promise<void> {
    return this.scriptRunner.uploadFile(transactionId, data)
  }

  downloadScripting(transaction_id: string): Promise<Buffer> {
    return this.scriptRunner.downloadFile(transaction_id)
  }

  async downloadFile(remotePath: string): Promise<Buffer> {
    return (await this.getFilesService()).download(remotePath)
  }

  getUploadDataFromScript(transactionId: string, img: any): Promise<void> {
    return this.scriptRunner.uploadFile(transactionId, img)
  }

  uploadDataFromScript(transactionId: string, img: any): Promise<void> {
    return this.scriptRunner.uploadFile(transactionId, img)
  }

  async uploadScriptWithBuffer(remotePath: string, img: Buffer): Promise<string> {
    return (await this.getFilesService()).upload(remotePath, img)
  }

  async uploadScriptWithString(remotePath: string, img: any): Promise<string> {
    return (await this.getFilesService()).upload(remotePath, Buffer.from(img, 'utf8'))
  }

  async insertDBData(collectName: string, doc: any,): Promise<InsertResult> {
    return (await this.getDatabaseService()).insertOne(collectName, doc, new InsertOptions(false, true))
  }

  async updateOneDBData(collectName: string, filter: JSONObject, update: JSONObject, option: UpdateOptions): Promise<UpdateResult> {
    return (await this.getDatabaseService()).updateOne(collectName, filter, update, option)
  }

  async deleateOneDBData(collectName: string, fillter: JSONObject): Promise<void> {
    return (await this.getDatabaseService()).deleteOne(collectName, fillter)
  }

  async queryDBData(collectionName: string, filter: any): Promise<JSONObject[]> {
    return (await this.getDatabaseService()).findMany(collectionName, filter)
  }
}