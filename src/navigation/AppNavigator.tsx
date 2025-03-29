import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AnalysisScreen from '../screens/AnalysisScreen';

console.log('AppNavigator.tsx 文件被加载');

const Stack = createStackNavigator();

const AppNavigator = () => {
  console.log('AppNavigator 组件开始渲染');
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Analyse">
        <Stack.Screen 
          name="Analyse" 
          component={AnalysisScreen} 
          options={{ 
            title: '棋局分析',
            headerShown: true // 确保显示标题栏
          }}
        />
        {/* 其他屏幕... */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;