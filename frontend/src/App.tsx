import { NavLink, Outlet } from "react-router-dom";

function App() {
  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <h1 className="logo">Parker</h1>
          <span className="tagline">Sulfur Sales Tools</span>
          <nav className="nav">
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              Price Dashboard
            </NavLink>
            <NavLink to="/quotes/new" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              New Quote
            </NavLink>
            <NavLink to="/quotes" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              Quotes
            </NavLink>
            <NavLink to="/import" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              Import
            </NavLink>
            <NavLink to="/customers" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              Customers
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

export default App;
