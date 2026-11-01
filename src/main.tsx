import React from 'react';
import ReactDOM from 'react-dom/client';
import { configureTaskApi } from '@organization_template/react-client';

import { App } from './App';
import { readAuthToken } from './authStorage';
import { apiBaseUrl } from './config';
import './styles.css';

configureTaskApi(apiBaseUrl, readAuthToken);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
