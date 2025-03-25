import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'react-native';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import HomeScreen from './src/screens/HomeScreen';
// 尝试使用动态导入解决问题
const AnalyseScreen = require('./src/screens/AnalyseScreen').default;

const Stack = createStackNavigator();

// 自定义主题
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#5d8a48', // 深绿色主题色
    accent: '#8aad6a', // 浅绿色强调色
    background: '#f5f5f5',
  },
};

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <StatusBar backgroundColor="#5d8a48" barStyle="light-content" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#5d8a48', // 深绿色导航栏
            },
            headerTintColor: '#fff', // 白色文字
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: '国际象棋分析' }}
          />
          <Stack.Screen 
            name="Analyse" 
            component={AnalyseScreen} // 修复这里的报错
            options={{ title: '局面分析' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
