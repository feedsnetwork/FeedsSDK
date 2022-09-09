import SigninEE from './SigninEE'
import { useEffect } from 'react';


function App() {
  useEffect(() => {
    getNFT();
  }, [])


  const getNFT = async () => {
    console.log("getNFT");
  }

  return (
    <div className="App">
      <header className="App-header">
        <SigninEE/>
      </header>
    </div>
  );
}

export default App;
