import { BrowserRouter as Router, useRoutes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { routes } from "./routes";

const AppRoutes = () => useRoutes(routes);

const App = () => (
  <Router>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </Router>
);

export default App;
