import { MyProfile } from "./MyProfile"
import { connectivity, DID } from '@elastosfoundation/elastos-connectivity-sdk-js'
import { EssentialsConnector } from '@elastosfoundation/essentials-connector-client-browser';
import { DefaultDIDAdapter, DIDBackend, VerifiablePresentation } from '@elastosfoundation/did-js-sdk';
import { AppContext } from "@elastosfoundation/hive-js-sdk/typings";

export class Authentication {
    private appContext: AppContext
    private essentialsConnector = new EssentialsConnector();
    private contractor(appDid: string) {
        // TODO:
    }

    private initConnectivitySDK() {
        const avaiConnectors = connectivity.getAvailableConnectors()
        if (avaiConnectors.findIndex( (option) => option.name == this.essentialsConnector.name) !== -1) {
            await connectivity.unregisterConnector(this.essentialsConnector.name)
            console.log('unregister connector succeeded')
        }

        await connectivity.registerConnector(this.essentialsConnector).then( async() => {
            connectivity.setApplicationDID(this.appContext.getAppDid())
/*
            connectivityInitialized = true;

            console.log('essentialsConnector', essentialsConnector);
            console.log('Wallet connect provider', essentialsConnector.getWalletConnectProvider());

            const hasLink = isUsingEssentialsConnector() && essentialsConnector.hasWalletConnectSession();
            console.log('Has link to essentials?', hasLink);

            // Restore the wallet connect session - TODO: should be done by the connector itself?
            if (hasLink && !essentialsConnector.getWalletConnectProvider().connected)
                await essentialsConnector.getWalletConnectProvider().enable();
*/
        });
    }

    applicationDID(applicationDID: any) {
        throw new Error("Method not implemented.");
    }

    public async signin() {
        await this.initConnectivitySDK();

        return new Promise<VerifiablePresentation>(async() => {
            const didAccess = new DID.DIDAccess()
            const presentation = await didAccess.requestCredentials({
                claims: [
                    DID.simpleIdClaim('Your avatar', 'avatar', false),
                    DID.simpleIdClaim('Your name', 'name', false),
                    DID.simpleIdClaim('Your description', 'description', false)
                ]
            })
        }).then(presentation => {
            DIDBackend.initialize(new DefaultDIDAdapter(""));
            const vp = VerifiablePresentation.parse(JSON.stringify(presentation.toJSON()))
            if (!vp.getHolder().toString()) {
                throw new Error("Unable to extra owner DID from the presetation")
            }

            const nameCredential = vp.getCredential('name')
            const name = nameCredential ? nameCredential.getSubject().getProperty('name'): '';

            const bioCredential = vp.getCredential('description')
            const bio = bioCredential ? bioCredential.getSubject().getProperty('description'): '';

            /*
            let essentialAddress = essentialsConnector.getWalletConnectProvider().wc.accounts[0]
            if (isInAppBrowser())
            essentialAddress = await window['elastos'].getWeb3Provider().address

            let user = {
                name: name,
                bio: bio,
                did: sDid,
                address: essentialAddress
            }

            sessionStorage.setItem("USER_DID", JSON.stringify(user));
                */
        }).catch (async error => {
            await this.essentialsConnector.getWalletConnectProvider().disconnect()
        })

    // TODO:
    }
}
