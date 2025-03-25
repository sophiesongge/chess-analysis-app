import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import HomeScreen from './src/screens/HomeScreen';
import AnalysisScreen from './src/screens/AnalysisScreen';

// 定义路由参数类型
type RootStackParamList = {
  Home: undefined;
  Analyse: { 
    fen?: string; 
    moveHistory?: string; // 添加moveHistory参数
  };
};

// 自定义主题，将主色调改为截图中的绿色
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#5d8a48', // 更深的森林绿色，与截图匹配
    accent: '#5d8a48',  // 保持一致的绿色
    background: '#f5f5f5', // 背景色保持浅色
  },
};

const Stack = createStackNavigator<RootStackParamList>();

function App() {
  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#5d8a48', // 导航栏背景色
            },
            headerTintColor: '#fff', // 导航栏文字颜色
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
            component={AnalysisScreen} 
            options={{ title: '局面分析' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

export default App;
