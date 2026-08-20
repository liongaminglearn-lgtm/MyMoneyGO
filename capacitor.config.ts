import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.liongamingacademy.mymoneygo',
  appName: 'MyMoneyGo',
  webDir: 'out',
  server: {
    url: 'https://www.mymoneygo.com',
    cleartext: false,
  },
  plugins: {
    StatusBar: {
      style: 'Light',
      backgroundColor: '#059669',
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#059669',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  },
  android: {
    backgroundColor: '#059669',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#059669',
  },
};

export default config;
