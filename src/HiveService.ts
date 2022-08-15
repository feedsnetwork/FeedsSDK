import { Executable, InsertOptions, File as HiveFile, ScriptRunner, Vault, AppContext, Logger as HiveLogger, UpdateResult, UpdateOptions, Condition, InsertResult } from "@elastosfoundation/hive-js-sdk"
import { Claims, DIDDocument, JWTHeader, JWTParserBuilder, DID, DIDBackend, DefaultDIDAdapter, JSONObject, VerifiablePresentation } from '@elastosfoundation/did-js-sdk'
import { connectivity, DID as ConDID, Hive } from "@elastosfoundation/elastos-connectivity-sdk-js"
import { Logger } from './utils/logger'
import { config } from './config'
let scriptRunners = {}

const cfig = new config()
const userDid = cfig.userDid
const currentNet = cfig.currentNet
const applicationDID = cfig.applicationDID
const resolverCache = cfig.resolverCache
const logger = new Logger("Feeds-web-dapp-HiveService")

export class HiveService {
  
  public image = null
  public appinstanceDid: string
  private vault: Vault
  private scriptRunner: ScriptRunner
  private scriptRunners: { [key: string]: ScriptRunner } = {}

  constructor() { }

  public async creatAppContext(appInstanceDocument, userDidString: string): Promise<AppContext> {
    return new Promise(async (resolve, reject) => {
      HiveLogger.setDefaultLevel(HiveLogger.TRACE)

      DIDBackend.initialize(new DefaultDIDAdapter(currentNet))
      try {
        AppContext.setupResolver(currentNet, resolverCache)
      } catch (error) {
        logger.error("error on creatAppContext: " + error)
        reject(error)
      }
      const path = "/data/userDir/data/store/develop"

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
              logger.error("error on getAppInstanceDocument: " + error)
              reject(error)
            }
          })
        },
        getAuthorization(jwtToken: string): Promise<string> {
          return new Promise(async (resolve, reject) => {
            try {
              const authToken = generateHiveAuthPresentationJWT(jwtToken)
              resolve(authToken)
            } catch (error) {
              logger.error("error on getAuthorization: " + error)
              reject(error)
            }
          })
        }
      }, userDidString, applicationDID);
      resolve(context)
    })
  }

  async creatScriptRunner(targetDid: string) {
    const appinstanceDocument = await getAppInstanceDIDDoc()
    const context = await this.creatAppContext(appinstanceDocument, targetDid)
    const scriptRunner = new ScriptRunner(context)
    if (scriptRunners === undefined) {
      scriptRunners = {}
    }
    scriptRunners[targetDid] = scriptRunner
  
    return scriptRunner
  }

  async createVault() {
    try {
      const appinstanceDocument = await getAppInstanceDIDDoc()
      const context = await this.creatAppContext(appinstanceDocument, userDid)
      const hiveVault = new Vault(context)

      const scriptRunner = await this.creatScriptRunner(userDid)
      if (scriptRunners === undefined) {
        scriptRunners = {}
      }

      scriptRunners[userDid] = scriptRunner

      return hiveVault
    }
    catch (error) {
      logger.error("error on createVault: " + error)
      throw error
    }
  }

  parseUserDIDDocumentForUserAvatar(userDid: string): Promise<{
    avatarParam: string;
    avatarScriptName: string;
    tarDID: string;
    tarAppDID: string;
  }> {
    return new Promise(async (resolve, reject) => {
      try {
        const userDID = DID.from(userDid)
        const userDIDDocument = await userDID.resolve()

        const avatarDid = userDid + "#avatar"
        const avatarVC = userDIDDocument.getCredential(avatarDid)
        if (!avatarVC) {// 没有有头像
          logger.warn("Not found avatar from did document")
          return null
        }

        const sub = avatarVC.getSubject()
        const pro = sub.getProperty("avatar")
        const data: string = pro["data"]
        // const type = pro["type"]
        const prefix = "hive://"
        const avatarParam = data.substr(prefix.length)
        // this.avatarParam = avatarParam
        const parts = avatarParam.split("/")
        if (parts.length < 2) // TODO 验证parts是否大于2个 ，否则 抛出异常
          throw "userDIDDocument 中缺少参数"

        const dids = parts[0].split("@")
        if (dids.length != 2) // TODO 验证dids是否等于2个 ，否则 抛出异常
          throw "userDIDDocument 中缺少参数"

        // const star = data.length - (prefix.length + parts[0].length + 1)
        const values = parts[1].split("?")
        if (values.length != 2) // TODO 验证values是否等于2个 ，否则 抛出异常
          throw "userDIDDocument 中缺少参数"

        const avatarScriptName = values[0]
        // this.avatarScriptName = avatarScriptName
        // const paramStr = values[1]
        // const scriptParam = JSON.parse(paramStr.substr(7))
        const tarDID = dids[0]
        const tarAppDID = dids[1]

        const res = {
          avatarParam: avatarParam,
          avatarScriptName: avatarScriptName,
          tarDID: tarDID,
          tarAppDID: tarAppDID
        }
        resolve(res)
      } catch (error) {
        reject(error)
      }
    });
  }

  async getScriptRunner(userDid: string): Promise<ScriptRunner> {
    try {
      this.scriptRunner = this.scriptRunners[userDid]

      if (this.scriptRunner === undefined || this.scriptRunner === null) {
        this.scriptRunner = await this.creatScriptRunner(userDid)
      }
      return this.scriptRunner
    } catch (error) {
      logger.error("error on getScriptRunner: " + error)
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
    return new Promise(async (resolve, reject) => {
      try {
        const databaseService = await this.getDatabaseService()
        const result = await databaseService.createCollection(channelName);
        resolve(result)
      } catch (error) {
        logger.error("error on createCollection: " + error)
        reject(error)
      }
    })
  }

  async deleteCollection(collectionName: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const databaseService = await this.getDatabaseService()
        const result = await databaseService.deleteCollection(collectionName);
        resolve(result)
      } catch (error) {
        logger.error("error on deleteCollection: " + error)
        reject(error)
      }
    })
  }

  registerScript(scriptName: string, executable: Executable, condition?: Condition, allowAnonymousUser?: boolean, allowAnonymousApp?: boolean): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        let scriptingService = await this.getScriptingService()
        await scriptingService.registerScript(scriptName, executable,
          condition, allowAnonymousUser, allowAnonymousApp)
        resolve()
      } catch (error) {
        logger.error("error on registerScript: " + error)
        reject(error)
      }
    })
  }

  async callScript(scriptName: string, document: any, targetDid: string, appid: string): Promise<any> {
    let scriptRunner = await this.getScriptRunner(targetDid)
    let result = await scriptRunner.callScript<any>(scriptName, document, targetDid, appid)
    return result
  }

  async uploadScriting(transactionId: string, data: string) {
    const scriptRunner = await this.getScriptRunner(userDid)
    return scriptRunner.uploadFile(transactionId, data)
  }

  async downloadEssAvatarTransactionId(avatarParam: string, avatarScriptName: string, tarDID: string, tarAppDID: string) {
    try {
      if (avatarParam === null || avatarParam === undefined) {
        return
      }
      const scriptRunner = await this.getScriptRunner(userDid)
      return await scriptRunner.callScript<any>(avatarScriptName, avatarParam, tarDID, tarAppDID)
    } catch (error) {
      logger.error("error on downloadEssAvatarTransactionId: " + error)
      throw error
    }
  }

  async downloadScripting(targetDid: string, transaction_id: string) {
    try {
      const scriptRunner = await this.getScriptRunner(targetDid)
      return await scriptRunner.downloadFile(transaction_id)
    } catch (error) {
      logger.error("error on downloadScripting: " + error)
      throw error
    }
  }

  async downloadFile(remotePath: string) {
    const fileService = await this.getFilesService()
    return await fileService.download(remotePath)
  }

  async getUploadDataFromScript(targetDid: string, transactionId: string, img: any) {
    try {
      const scriptRunner = await this.getScriptRunner(targetDid)
      return scriptRunner.uploadFile(transactionId, img)
    }
    catch (error) {
      logger.error("error on getUploadDataFromScript: " + error)
      throw error
    }
  }

  async uploadDataFromScript(targetDid: string, transactionId: string, img: any) {
    try {
      const scriptRunner = await this.getScriptRunner(targetDid)
      return scriptRunner.uploadFile(transactionId, img)
    }
    catch (error) {
      logger.error("error on uploadDataFromScript: " + error)
      throw error
    }
  }

  async uploadScriptWithBuffer(remotePath: string, img: Buffer) {
    try {
      const fileService = await this.getFilesService()
      return await fileService.upload(remotePath, img)
    }
    catch (error) {
      logger.error("error on uploadScriptWithBuffer: " + error)
      throw error
    }
  }

  async uploadScriptWithString(remotePath: string, img: any) {
    try {
      const fileService = await this.getFilesService()
      return await fileService.upload(remotePath, Buffer.from(img, 'utf8'))
    }
    catch (error) {
      logger.error("error on uploadScriptWithString: " + error)
      throw error
    }
  }

  insertDBData(collectName: string, doc: any,): Promise<InsertResult> {
    return new Promise(async (resolve, reject) => {
      try {
        const dbService = await this.getDatabaseService()
        const insertResult = await dbService.insertOne(collectName, doc, new InsertOptions(false, true));
        resolve(insertResult)
      } catch (error) {
        logger.error("error on insertDBData: " + error)
        reject(error)
      }
    })
  }

  updateOneDBData(collectName: string, filter: JSONObject, update: JSONObject, option: UpdateOptions): Promise<UpdateResult> {
    return new Promise(async (resolve, reject) => {
      try {
        const dbService = await this.getDatabaseService()
        const result = await dbService.updateOne(collectName, filter, update, option)
        resolve(result)
      } catch (error) {
        logger.error("error on updateOneDBData: " + error)
        reject(error)
      }
    })
  }

  deleateOneDBData(collectName: string, fillter: JSONObject): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const dbService = await this.getDatabaseService()
        await dbService.deleteOne(collectName, fillter)
        resolve()
      } catch (error) {
        logger.error("error on deleateOneDBData: " + error)
        reject(error)
      }
    })
  }

  queryDBData(collectionName: string, filter: any): Promise<JSONObject[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const dbService = await this.getDatabaseService()
        const result = dbService.findMany(collectionName, filter)
        resolve(result)
      } catch (error) {
        logger.error("error on queryDBData: " + error)
        reject(error)
      }
    })
  }

  newInsertOptions() {
    return new InsertOptions(false, true)
  }
}

const storePassword = "storepass"
const generateHiveAuthPresentationJWT = async (challeng) => {
  if (challeng === null || challeng === undefined || challeng === '') {
    logger.error("error on challeng = " + challeng)
    //  TODO :
  }

  // Parse, but verify on chain that this JWT is valid first 
  const JWTParser = new JWTParserBuilder().build()
  const parseResult = await JWTParser.parse(challeng)
  const claims = parseResult.getBody()
  if (claims === undefined) {
    logger.error("error on generateHiveAuthPresentationJWT: claims = " + claims)
    return // 抛出error
  }
  const payload = claims.getJWTPayload()
  const nonce = payload['nonce'] as string
  const hiveDid = claims.getIssuer()
  const appIdCredential = await issueDiplomaFor()
  const presentation = await createPresentation(appIdCredential, hiveDid, nonce)
  const token = await createChallengeResponse(presentation, hiveDid, storePassword)
  return token
}


async function getAppInstanceDIDDoc() {
  const didAccess = new ConDID.DIDAccess()
  const info = await didAccess.getOrCreateAppInstanceDID()
  const instanceDIDDocument = await info.didStore.loadDid(info.did.toString())
  console.log("instanceDIDDocument ======= ", instanceDIDDocument)
  return instanceDIDDocument
}

async function issueDiplomaFor() {
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

// todo: instanceDid instanceStorePassword
async function createPresentation(vc, hiveDid, nonce) {
  const access = new ConDID.DIDAccess()
  const info = await access.getOrCreateAppInstanceDID()
  const info2 = await access.getExistingAppInstanceDIDInfo()
  const vpb = await VerifiablePresentation.createFor(info.did, null, info.didStore)
  const vp = await vpb.credentials(vc).realm(hiveDid).nonce(nonce).seal(info2.storePassword)
  return vp
}

const createChallengeResponse = async (vp, hiveDid, storepass) => {
  const exp = new Date()
  const iat = new Date().getTime()
  exp.setFullYear(exp.getFullYear() + 2)
  const expTime = exp.getTime()

  // Create JWT token with presentation.
  const doc = await getAppInstanceDIDDoc()
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