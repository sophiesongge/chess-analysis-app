import { AppRegistry } from 'react-native';
// 根据实际情况选择导入 App 或 AppNavigator
import App from './src/App';
// 或者
// import App from './src/navigation/AppNavigator';
import { name as appName } from './app.json';

console.log('index.js 文件被加载');
AppRegistry.registerComponent(appName, () => App);