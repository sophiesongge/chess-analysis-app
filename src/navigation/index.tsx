import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import AnalysisScreen from '../screens/AnalysisScreen';

// 添加日志确认加载
console.log('加载导航配置，使用 AnalysisScreen 组件');

// 定义路由参数类型
type RootStackParamList = {
  Home: undefined;
  Analyse: { fen?: string };
};

const Stack = createStackNavigator<RootStackParamList>();

function AppNavigator() {
  useEffect(() => {
    console.log('AppNavigator 已挂载，使用 AnalysisScreen 组件');
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen 
          name="Analyse" 
          component={AnalysisScreen}
          options={{ title: 'Analysis Screen' }} // 添加标题以便区分
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;