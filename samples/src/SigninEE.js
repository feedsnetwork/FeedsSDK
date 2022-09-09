
import React, {useState} from 'react'
<<<<<<< HEAD
import { signin, signout, checkSign } from '@pasarprotocol/pasar-sdk-development';
=======
import { signin, signout, checkSign } from '@feedsnetwork/feeds-sdk-development';
>>>>>>> d3ec102 (Update a new version)
import {
  useNavigate
} from "react-router-dom";

function SigninEE() {
  const navigate = useNavigate();
  const [login, setLogin] = useState(checkSign());

  const handleSigninEE1 = async () => {
    let result = await signin();
    setLogin(checkSign());
  }

  const handleSignout = async () => {
    await signout();
    setLogin(checkSign());
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
