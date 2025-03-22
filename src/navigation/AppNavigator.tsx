import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
// 修改导入方式，尝试默认导入
import HomeScreen from '../screens/HomeScreen';
import AnalyseScreen from '../screens/AnalyseScreen';

// 定义导航参数类型，确保与组件中定义的一致
type RootStackParamList = {
  Home: undefined;
  Analyse: { fen?: string };
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{
            title: '国际象棋分析',
            headerStyle: {
              backgroundColor: '#f4511e',
            },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen 
          name="Analyse" 
          component={AnalyseScreen}
          options={{
            title: '局面分析',
            headerStyle: {
              backgroundColor: '#f4511e',
            },
            headerTintColor: '#fff',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};