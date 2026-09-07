import { useState, useCallback, useEffect } from 'react';

// Google API types
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

interface PickerResult {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  sizeBytes?: number;
}

export function useGoogleDrivePicker() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // @ts-ignore
  const CLIENT_ID = import.meta.env.VITE_OAUTH_CLIENT_ID;
  const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly';
  const APP_ID = CLIENT_ID?.split('-')[0]; // Extract App ID from Client ID

  useEffect(() => {
    let pickerInited = false;
    let gisInited = false;

    const checkReady = () => {
      if (pickerInited && gisInited) {
        setIsReady(true);
      }
    };

    const initializePicker = () => {
      if (window.gapi) {
        window.gapi.load('picker', { callback: () => { pickerInited = true; checkReady(); } });
      } else {
        setTimeout(initializePicker, 100);
      }
    };

    const initializeGis = () => {
      if (window.google?.accounts?.oauth2) {
        gisInited = true;
        checkReady();
      } else {
        setTimeout(initializeGis, 100);
      }
    };

    initializePicker();
    initializeGis();
  }, []);

  const openPicker = useCallback((): Promise<PickerResult[]> => {
    return new Promise((resolve, reject) => {
      if (!isReady) {
        reject(new Error('Google Picker is not initialized yet.'));
        return;
      }

      if (!CLIENT_ID) {
        reject(new Error('Missing Google OAuth Client ID (VITE_OAUTH_CLIENT_ID).'));
        return;
      }

      setError(null);

      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse: any) => {
          if (tokenResponse.error !== undefined) {
            setError(tokenResponse.error);
            reject(tokenResponse.error);
            return;
          }
          createPicker(tokenResponse.access_token);
        },
      });

      tokenClient.requestAccessToken({ prompt: 'consent' });

      function createPicker(accessToken: string) {
        const view = new window.gapi.picker.DocsView(window.gapi.picker.ViewId.DOCS);
        view.setIncludeFolders(true);
        view.setSelectFolderEnabled(false);

        const picker = new window.gapi.picker.PickerBuilder()
          .enableFeature(window.gapi.picker.Feature.NAV_HIDDEN)
          .enableFeature(window.gapi.picker.Feature.MULTISELECT_ENABLED)
          .setOAuthToken(accessToken)
          .addView(view)
          .addView(new window.gapi.picker.DocsUploadView())
          .setAppId(APP_ID)
          .setCallback((data: any) => {
            if (data[window.gapi.picker.Response.ACTION] === window.gapi.picker.Action.PICKED) {
              const docs = data[window.gapi.picker.Response.DOCUMENTS];
              const results: PickerResult[] = docs.map((doc: any) => ({
                id: doc.id,
                name: doc.name,
                url: doc.url,
                mimeType: doc.mimeType,
                sizeBytes: doc.sizeBytes,
              }));
              resolve(results);
            } else if (data[window.gapi.picker.Response.ACTION] === window.gapi.picker.Action.CANCEL) {
              resolve([]);
            }
          })
          .build();
        picker.setVisible(true);
        // Fix z-index for picker dialog
        setTimeout(() => {
          const dialogs = document.querySelectorAll('.picker-dialog-bg, .picker-dialog');
          dialogs.forEach((el: any) => {
            el.style.zIndex = '9999';
          });
        }, 100);
      }
    });
  }, [isReady, CLIENT_ID, APP_ID]);

  return { openPicker, isReady, error };
}
