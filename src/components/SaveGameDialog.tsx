import React, { useState, useEffect } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { Dialog, Portal, TextInput, Button } from 'react-native-paper';

// 导入API服务
import { saveGame } from '../services/api';

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

  // 当对话框显示或计数器变化时，更新默认游戏名称
  useEffect(() => {
    if (visible) {
      setGameName(`ChessGame_${defaultCounter}`);
    }
  }, [visible, defaultCounter]);

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
  };

  // 取消保存
  const handleCancel = () => {
    resetForm();
    onDismiss();
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
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
          <TextInput
            label="白方棋手"
            value={whitePlayerName}
            onChangeText={setWhitePlayerName}
            style={styles.textInput}
            mode="outlined"
            outlineColor="#5d8a48"
            activeOutlineColor="#5d8a48"
          />
          <TextInput
            label="黑方棋手"
            value={blackPlayerName}
            onChangeText={setBlackPlayerName}
            style={styles.textInput}
            mode="outlined"
            outlineColor="#5d8a48"
            activeOutlineColor="#5d8a48"
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={handleCancel} color="#5d8a48" disabled={isSaving}>取消</Button>
          <Button onPress={saveGameToServer} color="#5d8a48" loading={isSaving} disabled={isSaving}>保存</Button>
        </Dialog.Actions>
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
    paddingBottom: 20,
  },
  textInput: {
    marginBottom: 12,
    backgroundColor: 'white',
  },
});

export default SaveGameDialog;