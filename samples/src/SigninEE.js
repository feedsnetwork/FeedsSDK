
import React, {useState} from 'react'
import { signin, signout, checkSignin, AppContext } from '@feedsnetwork/feeds-sdk-development';
import {
  useNavigate
} from "react-router-dom";

function SigninEE() {
  const navigate = useNavigate();
  const [login, setLogin] = useState(checkSignin());
  const appCtx = new AppContext();

  const handleSigninEE = async () => {
    const myprofile = await signin(appCtx);

    console.log(`name: ${myprofile.getName()}`);
    console.log(`description: ${myprofile.getDescription()}`);

    setLogin(checkSignin(appCtx));
  }

  const handleSignout = async () => {
    await signout(appCtx);
    setLogin(checkSignin(appCtx));
  }

  const handleClickButton = (path) => {
    navigate(path);
  }

  return (
    !login ?
    <div>
        <button onClick={handleSigninEE}>Sign in with EE</button>
    </div> :
    <div>
        <button onClick={handleSignout}>Sign out</button>

        <div>
          <button onClick={()=> handleClickButton('/myprofile')}>My Profile</button>
        </div>

    </div>
  );
}

export default SigninEE;
