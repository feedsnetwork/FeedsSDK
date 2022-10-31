
import { VerifiablePresentation } from '@elastosfoundation/did-js-sdk';
import { DID, connectivity } from '@elastosfoundation/elastos-connectivity-sdk-js';
import { EssentialsConnector } from '@elastosfoundation/essentials-connector-client-browser';

const essentialsConnector = new EssentialsConnector();
let connectivityInitialized = false;
let isSignin = false;

const isInAppBrowser = () => {
    console.log("isInAppBrowser ================== 0")
    return window['elastos'] !== undefined && window['elastos'].name === 'essentialsiab';
}

const isUsingEssentialsConnector = () => {
    console.log("isUsingEssentialsConnector ================== 0")
    const activeConnector = connectivity.getActiveConnector();
    return activeConnector && activeConnector.name === essentialsConnector.name;
}

const initConnectivitySDK = async (appDid) => {
    console.log("initConnectivitySDK ================== 0")

    if (connectivityInitialized) return;

    // logger.info('Preparing the Elastos connectivity SDK');

    // unregistear if already registerd
    const arrIConnectors = connectivity.getAvailableConnectors();
    if (arrIConnectors.findIndex((option) => option.name === essentialsConnector.name) !== -1) {
        await connectivity.unregisterConnector(essentialsConnector.name);
        // logger.info('unregister connector succeed.');
    }

    await connectivity.registerConnector(essentialsConnector).then(async () => {

        connectivity.setApplicationDID(appDid)
        connectivityInitialized = true;

        // logger.info('essentialsConnector', essentialsConnector);
        // logger.info('Wallet connect provider', essentialsConnector.getWalletConnectProvider());

        const hasLink = isUsingEssentialsConnector() && essentialsConnector.hasWalletConnectSession();
        // logger.info('Has link to essentials?', hasLink);

        // Restore the wallet connect session - TODO: should be done by the connector itself?
        if (hasLink && !essentialsConnector.getWalletConnectProvider().connected)
            await essentialsConnector.getWalletConnectProvider().enable();
    });
}

const signOutWithEssentials = async () => {
    console.log("signOutWithEssentials ================== 0")
    if (isUsingEssentialsConnector() && essentialsConnector.hasWalletConnectSession()) {
        await essentialsConnector.disconnectWalletConnect().catch(error => {
            // logger.info("Error while disconnecting the Essentials wallet", error);
        })
    }

    if (isInAppBrowser() && (await window['elastos'].getWeb3Provider().isConnected())) {
        await window['elastos'].getWeb3Provider().disconnect().catch(error => {
            // logger.info("Error while disconnecting the wallet")
        })
    }
};

const signInWithEssentials = async (appDid) => {
    console.log("signInWithEssentials ================== 0")

    await initConnectivitySDK(appDid).catch(error => {
        throw new Error(error);
    })
    console.log("================================== 5")

    const didAccess = new DID.DIDAccess();
    const claims = [
        DID.simpleIdClaim('Your avatar', 'avatar', false),
        DID.simpleIdClaim('Your name', 'name', false),
        DID.simpleIdClaim('Your description', 'description', false)
    ]
    console.log("================================== 6")

    return await didAccess.requestCredentials({ claims: claims }).then(presentation => {
        const userDid = 'did:elastos:' + presentation.getHolder().getMethodSpecificId();
        // logger.info("The holder Did of requested credential :", userDid)

        const vp = VerifiablePresentation.parse(JSON.stringify(presentation.toJSON()));
        const hoderDid = vp.getHolder().toString();
        if (!hoderDid) {
            // logger.error('Unable to extract owner DID from the presentation')
            throw new Error("No DID extracted from presentation");
        }

        const nameCredential = vp.getCredential(`name`);
        const bioCredential = vp.getCredential(`description`);

        let walletAddress = essentialsConnector.getWalletConnectProvider().wc.accounts[0]
        if (isInAppBrowser()) {
            walletAddress = window['elastos'].getWeb3Provider().address;
        }

        isSignin = true;
        // return new MyProfile(appContext, userDid, nameCredential, bioCredential)
        return userDid

    }).catch(async error => {
        await essentialsConnector.getWalletConnectProvider().disconnect();
        // logger.error(error);
        throw new Error(error);
    }).catch(error => {
        // logger.error(error);
        throw new Error(error);
    })
}

const signin = async (appDid) => {
    console.log("signin ================== 0")
    if (isUsingEssentialsConnector()) {
        await signOutWithEssentials();
    }
    console.log("================================== 2")

    if (essentialsConnector.hasWalletConnectSession()) {
        await essentialsConnector.disconnectWalletConnect();
    }
    console.log("================================== 3")

    return signInWithEssentials(appDid);
}

const signout = async () => {
    console.log("signout ================== 0")
    await signOutWithEssentials();
    isSignin = false;
}

const checkSignin = () => {
    console.log("checkSignin ================== 0")
    return isSignin;
}

export {
    signin,
    signout,
    checkSignin
}