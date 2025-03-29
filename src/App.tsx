import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
// 修改导入方式，确保正确导入 AnalysisScreen 组件
import AnalysisScreen from './screens/AnalysisScreen';

const Stack = createStackNavigator();

const App = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Analysis">
          <Stack.Screen 
            name="Analysis" 
            component={AnalysisScreen} 
            options={{ title: '棋局分析' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
};

export default App;