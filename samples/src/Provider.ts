import { RuntimeContext } from '@feedsnetwork/feeds-sdk-development';
import { connectivity, DID as ConDID } from "@elastosfoundation/elastos-connectivity-sdk-js"
import { JWTHeader, JWTParserBuilder, DIDDocument, VerifiablePresentation } from '@elastosfoundation/did-js-sdk'

export class Provider {

  private appInstanceDIDDocument: DIDDocument // todo
  private localDataDir: string // todo

  public constructor(localDataDir: string) {
    this.localDataDir = localDataDir
  }

  createHiveContextProvider() {
    let self = this
    return {
      getLocalDataDir: (): string => this.localDataDir,
      getAppInstanceDocument: (): Promise<DIDDocument> => Promise.resolve(this.getAppInstanceDIDDocument()),
      getAuthorization: (jwtToken: string): Promise<string> => {
        return new Promise(async (resolve, reject) => {
          try {
            const authToken = await self.generateHiveAuthPresentationJWT(jwtToken)
            resolve(authToken)
          } catch (error) {
            console.log("Generate hive auth presentation JWT error: ", error)
            reject(error)
          }
        })
      }
    }
  }

  private async getAppInstanceDIDDocument() {
    if (this.appInstanceDIDDocument === null || this.appInstanceDIDDocument === undefined) {
      const didAccess = new ConDID.DIDAccess()
      const info = await didAccess.getOrCreateAppInstanceDID()
      const instanceDIDDocument = await info.didStore.loadDid(info.did.toString())
      this.appInstanceDIDDocument = instanceDIDDocument
    }

    return this.appInstanceDIDDocument
  }

  private async generateHiveAuthPresentationJWT(challeng: string) {

    if (challeng === null || challeng === undefined || challeng === '') {
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

  private async createPresentation(vc, hiveDid, nonce) {
    const access = new ConDID.DIDAccess()
    const info = await access.getOrCreateAppInstanceDID()
    const info2 = await access.getExistingAppInstanceDIDInfo()
    const vpb = await VerifiablePresentation.createFor(info.did, null, info.didStore)
    const vp = await vpb.credentials(vc).realm(hiveDid).nonce(nonce).seal(info2.storePassword)
    return vp
  }


  private async createChallengeResponse(vp, hiveDid) {
    const exp = new Date()
    const iat = new Date().getTime()
    exp.setFullYear(exp.getFullYear() + 2)
    const expTime = exp.getTime()

    // Create JWT token with presentation.
    const doc = await this.getAppInstanceDIDDocument()
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

  private async issueDiplomaFor() {
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
}

