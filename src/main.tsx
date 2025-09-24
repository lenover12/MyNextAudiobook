import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { OptionsProvider } from "./hooks/useOptions";
import { HistoryProvider } from "./hooks/useHistory";
import { FavouritesProvider } from "./hooks/useFavourites";

import '@fortawesome/fontawesome-free/css/all.min.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OptionsProvider>
      <HistoryProvider>
        <FavouritesProvider>
          <App />
        </FavouritesProvider>
      </HistoryProvider>
    </OptionsProvider>
  </StrictMode>,
)
