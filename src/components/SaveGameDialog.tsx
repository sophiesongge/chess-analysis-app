import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Alert, View, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Dialog, Portal, TextInput, Button, List, Divider } from 'react-native-paper';

// 导入API服务
import { saveGame, getPlayerSuggestions } from '../services/api';

// 定义组件属性类型
interface SaveGameDialogProps {
  visible: boolean;
  onDismiss: () => void;
  currentFen: string;
  moveHistory: any[];
  defaultCounter: number;
  onSaveSuccess: (newCounter: number) => void;
}

// 保存棋局对话框组件
const SaveGameDialog = ({
  visible,
  onDismiss,
  currentFen,
  moveHistory,
  defaultCounter,
  onSaveSuccess
}: SaveGameDialogProps) => {
  // 状态管理
  const [gameName, setGameName] = useState('');
  const [whitePlayerName, setWhitePlayerName] = useState('');
  const [blackPlayerName, setBlackPlayerName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // 添加筛选后的建议列表状态
  const [whitePlayerSuggestions, setWhitePlayerSuggestions] = useState<string[]>([]);
  const [blackPlayerSuggestions, setBlackPlayerSuggestions] = useState<string[]>([]);
  // 添加显示建议菜单的状态
  const [showWhiteSuggestions, setShowWhiteSuggestions] = useState(false);
  const [showBlackSuggestions, setShowBlackSuggestions] = useState(false);
  
  // 添加引用来获取滚动视图
  const scrollViewRef = useRef<ScrollView>(null);

  // 当对话框显示或计数器变化时，更新默认游戏名称
  useEffect(() => {
    if (visible) {
      setGameName(`ChessGame_${defaultCounter}`);
    }
  }, [visible, defaultCounter]);

  // 处理白方棋手名字输入变化
  const handleWhitePlayerNameChange = async (text: string) => {
    setWhitePlayerName(text);
    if (text.trim().length >= 2) {
      // 使用新的API获取建议
      const suggestions = await getPlayerSuggestions(text);
      setWhitePlayerSuggestions(suggestions);
      setShowWhiteSuggestions(suggestions.length > 0);
      // 如果显示白方建议，隐藏黑方建议
      if (suggestions.length > 0) {
        setShowBlackSuggestions(false);
      }
    } else {
      setShowWhiteSuggestions(false);
    }
  };

  // 处理黑方棋手名字输入变化
  const handleBlackPlayerNameChange = async (text: string) => {
    setBlackPlayerName(text);
    if (text.trim().length >= 2) {
      // 使用新的API获取建议
      const suggestions = await getPlayerSuggestions(text);
      setBlackPlayerSuggestions(suggestions);
      setShowBlackSuggestions(suggestions.length > 0);
      // 如果显示黑方建议，隐藏白方建议
      if (suggestions.length > 0) {
        setShowWhiteSuggestions(false);
      }
    } else {
      setShowBlackSuggestions(false);
    }
  };

  // 选择白方棋手建议
  const selectWhitePlayerSuggestion = (name: string) => {
    setWhitePlayerName(name);
    setShowWhiteSuggestions(false);
    Keyboard.dismiss();
  };

  // 选择黑方棋手建议
  const selectBlackPlayerSuggestion = (name: string) => {
    setBlackPlayerName(name);
    setShowBlackSuggestions(false);
    Keyboard.dismiss();
  };

  // 保存棋局到服务器
  const saveGameToServer = async () => {
    try {
      setIsSaving(true);
      
      // 获取当前日期
      const currentDate = new Date();
      const formattedDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      
      // 准备要保存的数据
      const gameData = {
        name: gameName,
        fen: currentFen,
        whitePlayer: whitePlayerName || '未知',
        blackPlayer: blackPlayerName || '未知',
        date: formattedDate,
        moveHistory: JSON.stringify(moveHistory)
      };
      
      // 调用API保存棋局
      await saveGame(gameData);
      
      // 保存成功后增加计数器并通知父组件
      onSaveSuccess(defaultCounter + 1);
      
      // 显示成功消息
      Alert.alert('保存成功', `棋局 "${gameName}" 已成功保存！`);
      
      // 重置表单并关闭对话框
      resetForm();
      onDismiss();
    } catch (error) {
      console.error('保存棋局失败:', error);
      Alert.alert('保存失败', '无法保存棋局，请稍后再试。');
    } finally {
      setIsSaving(false);
    }
  };

  // 重置表单
  const resetForm = () => {
    setWhitePlayerName('');
    setBlackPlayerName('');
    setShowWhiteSuggestions(false);
    setShowBlackSuggestions(false);
  };

  // 取消保存
  const handleCancel = () => {
    resetForm();
    onDismiss();
  };

  // 点击对话框背景时隐藏建议
  const handleDialogPress = () => {
    setShowWhiteSuggestions(false);
    setShowBlackSuggestions(false);
    Keyboard.dismiss();
  };

  // 黑方棋手输入框建议列表部分需要修改
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <TouchableWithoutFeedback onPress={handleDialogPress}>
          <View>
            <Dialog.Title style={styles.dialogTitle}>保存棋局</Dialog.Title>
            <Dialog.Content style={styles.dialogContent}>
              <TextInput
                label="棋局名称"
                value={gameName}
                onChangeText={setGameName}
                style={styles.textInput}
                mode="outlined"
                outlineColor="#5d8a48"
                activeOutlineColor="#5d8a48"
              />
              
              {/* 白方棋手输入框 */}
              <View style={styles.autocompleteContainer}>
                <TextInput
                  label="白方棋手"
                  value={whitePlayerName}
                  onChangeText={handleWhitePlayerNameChange}
                  style={styles.textInput}
                  mode="outlined"
                  outlineColor="#5d8a48"
                  activeOutlineColor="#5d8a48"
                  onFocus={() => {
                    // 无论如何，先隐藏黑方建议
                    setShowBlackSuggestions(false);
                    // 只有当有建议时才显示白方建议
                    if (whitePlayerName.trim().length >= 2 && whitePlayerSuggestions.length > 0) {
                      setShowWhiteSuggestions(true);
                    }
                  }}
                />
                
                {/* 白方棋手建议列表 - 使用固定高度的滚动视图 */}
                {showWhiteSuggestions && (
                  <View style={styles.suggestionsContainer}>
                    <ScrollView 
                      style={styles.suggestionsList}
                      keyboardShouldPersistTaps="handled"
                      nestedScrollEnabled={true}
                    >
                      {whitePlayerSuggestions.map((name, index) => (
                        <List.Item
                          key={`white-${index}`}
                          title={name}
                          onPress={() => selectWhitePlayerSuggestion(name)}
                          style={styles.suggestionItem}
                          titleStyle={styles.suggestionText}
                          left={props => <List.Icon {...props} icon="account" color="#5d8a48" />}
                        />
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
              
              {/* 黑方棋手输入框 */}
              <View style={styles.autocompleteContainer}>
                <TextInput
                  label="黑方棋手"
                  value={blackPlayerName}
                  onChangeText={handleBlackPlayerNameChange}
                  style={styles.textInput}
                  mode="outlined"
                  outlineColor="#5d8a48"
                  activeOutlineColor="#5d8a48"
                  onFocus={() => {
                    // 无论如何，先隐藏白方建议
                    setShowWhiteSuggestions(false);
                    // 只有当有建议时才显示黑方建议
                    if (blackPlayerName.trim().length >= 2 && blackPlayerSuggestions.length > 0) {
                      setShowBlackSuggestions(true);
                    }
                  }}
                />
                
                {/* 黑方棋手建议列表 - 使用固定高度的滚动视图 */}
                {showBlackSuggestions && (
                  <View style={styles.suggestionsContainer}>
                    <ScrollView 
                      style={styles.suggestionsList}
                      keyboardShouldPersistTaps="handled"
                      nestedScrollEnabled={true}
                    >
                      {blackPlayerSuggestions.map((name, index) => (
                        <List.Item
                          key={`black-${index}`}
                          title={name}
                          onPress={() => selectBlackPlayerSuggestion(name)}
                          style={styles.suggestionItem}
                          titleStyle={styles.suggestionText}
                          left={props => <List.Icon {...props} icon="account" color="#5d8a48" />}
                        />
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={handleCancel} color="#5d8a48" disabled={isSaving}>取消</Button>
              <Button onPress={saveGameToServer} color="#5d8a48" loading={isSaving} disabled={isSaving}>保存</Button>
            </Dialog.Actions>
          </View>
        </TouchableWithoutFeedback>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    borderRadius: 16,
  },
  dialogTitle: {
    textAlign: 'center',
    fontSize: 20,
    color: '#5d8a48',
  },
  dialogContent: {
    paddingBottom: 10,
  },
  textInput: {
    marginBottom: 12,
    backgroundColor: 'white',
  },
  autocompleteContainer: {
    position: 'relative',
    marginBottom: 12,
    zIndex: 1,
  },
  suggestionsContainer: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 8,
    maxHeight: 120, // 固定最大高度
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  suggestionsList: {
    maxHeight: 120, // 与容器高度一致
  },
  suggestionItem: {
    paddingVertical: 4, // 减小垂直内边距
    paddingHorizontal: 8, // 减小水平内边距
    height: 40, // 固定每个项目的高度
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
  },
});

export default SaveGameDialog;