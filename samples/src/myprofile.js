import { useState, useEffect } from "react";
import {RuntimeContext, MyProfile as FeedsMyProfile } from '@feedsnetwork/feeds-sdk-development';
async function MyProfile() {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    /*
    const [image, setImage] = useState(null); */
    const [urlImage, setUrlImage] = useState('');
    const [progress, setProgress] = useState(0);

    // 测试代码
    const context = RuntimeContext.getInstance()
    const userDid = context.getUserDid() 
    const myProfile = MyProfile(context, userDid, null, null, null)
    const resultSubscriptions = await myProfile.querySubscriptions()
    console.log("resultSubscriptions ======================================== ", resultSubscriptions)


    useEffect(() => {
        console.log(progress);
    }, [progress]);

    const handleMint = async () => {
        console.log(name);
        console.log(description);
        console.log(urlImage);
        //let result = await mintNft(name, description, urlImage, "0x32496388d7c0CDdbF4e12BDc84D39B9E42ee4CB0", 10, null, false, setProgress);
        console.log(name);
    }

    const handleChangeImage = (e) => {
        //setUrlImage(e.target.files[0]);
    }

    return (
        <div>
            <div>
                <input type="file" onChange={e => handleChangeImage(e)}/>

            </div>
            <div>
                <h3 className="sub_title">Name</h3>
                <input value={name} onChange={(e) => setName(e.target.value)}/>
            </div>
            <div>
                <h3 className="sub_title">Description</h3>
                <input value={description} onChange={(e) => setDescription(e.target.value)}/>
            </div>
            <button onClick={handleMint}>Create a Channel</button>
        </div>
    );
}

export default MyProfile;
