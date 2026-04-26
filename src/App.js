import { Provider } from "react-redux"

import { AppRouter } from "./routers/AppRouter";
import { store } from "./redux/store/store";

import "./scss/styles.scss";

// Apply saved theme on initial load
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark-mode");
}

const App = () => {
  return (
    <Provider store={store}>
      <AppRouter />
    </Provider>
  );
}

export default App;
