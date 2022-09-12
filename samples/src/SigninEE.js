
import React, {useState} from 'react'
import { signin, signout, checkSignin } from '@feedsnetwork/feeds-sdk-development';
import {
  useNavigate
} from "react-router-dom";

function SigninEE() {
  const navigate = useNavigate();
  const [login, setLogin] = useState(checkSignin());

  const handleSigninEE1 = async () => {
    let result = await signin();
    setLogin(checkSignin());
  }

  const handleSignout = async () => {
    await signout();
    setLogin(checkSignin());
  }

  const handleClickButton = (path) => {
    navigate(path);
  }

  return (
    !login ?
    <div>
        <button onClick={handleSigninEE1}>Sign in with EE</button>
        {/* <button onClick={handleSigninMM}>Sign in with MM</button> */}
    </div> :
    <div>
        <button onClick={handleSignout}>Sign out</button>

        <div>
          <button onClick={()=> handleClickButton('/create')}>Create New Channel</button>
        </div>

    </div>
  );
}

export default SigninEE;
