import SigninEE from './SigninEE'
import { useEffect } from 'react';


function App() {
  useEffect(() => {
    runFeeds();
  }, [])


  const runFeeds = async () => {
    console.log("Run samples integrating Feeds SDK");
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
