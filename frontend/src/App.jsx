import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Chat from './pages/Chat/Chat';
import Profile from './pages/Profile/Profile';
import LogInRegRotation from './pages/LogInReg/LogInRegRotation';

function App() {
  return (
    <Router>
      <Routes>
        
        <Route path="/" element={<LogInRegRotation />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}

export default App;