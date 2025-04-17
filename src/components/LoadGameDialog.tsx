import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, ActivityIndicator, Text, TextInput } from 'react-native';
import { Dialog, Portal, Button, List, Searchbar, Divider } from 'react-native-paper';
import { getSavedGames, getGameDetails } from '../services/api';

// 定义组件属性类型
interface LoadGameDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onGameLoad: (gameData: any) => void;
}

// 棋局项类型
interface GameItem {
  id: string;
  name: string;
  whitePlayer: string;
  blackPlayer: string;
  date: string;
}

// 载入棋局对话框组件
const LoadGameDialog = ({ visible, onDismiss, onGameLoad }: LoadGameDialogProps) => {
  // 状态管理
  const [games, setGames] = useState<GameItem[]>([]);
  const [filteredGames, setFilteredGames] = useState<GameItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingGameId, setLoadingGameId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 当对话框显示时加载棋局列表
  useEffect(() => {
    if (visible) {
      loadGames();
    }
  }, [visible]);

  // 当搜索查询变化时过滤棋局
  useEffect(() => {
    filterGames();
  }, [searchQuery, games]);

  // 添加分页相关状态
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10; // 每页显示10个棋局

  // 添加排序状态
  const [sortBy, setSortBy] = useState('date'); // 'date', 'name', 'white', 'black'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'

  // 添加高级搜索选项
  const [searchFilters, setSearchFilters] = useState({
    dateFrom: '',
    dateTo: '',
    playerName: '',
    result: '' // 例如: '1-0', '0-1', '1/2-1/2'
  });

  // 添加高级搜索切换状态
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

  // 修改加载棋局的函数，支持分页
  const loadGames = async (refresh = true) => {
    if (refresh) {
      setIsLoading(true);
      setPage(1);
      setGames([]);
    } else {
      // 加载更多时不重置列表
    }
    
    setError(null);
    try {
      // 传递分页参数到API
      const gamesData = await getSavedGames(page, PAGE_SIZE);
      console.log('LoadGameDialog收到的棋局数据:', gamesData);
      
      const formattedGames = gamesData.map(game => ({
        id: game.id || game._id || String(game.gameId || ''),
        name: game.name || '未命名棋局',
        whitePlayer: game.whitePlayer || game.white_player || '未知',
        blackPlayer: game.blackPlayer || game.black_player || '未知',
        date: game.date || game.created_at || new Date().toLocaleDateString(),
      }));
      
      // 判断是否还有更多数据
      setHasMore(formattedGames.length === PAGE_SIZE);
      
      if (refresh) {
        setGames(formattedGames);
      } else {
        // 追加新数据到现有列表
        setGames(prevGames => [...prevGames, ...formattedGames]);
      }
    } catch (err) {
      setError('无法加载棋局列表，请稍后再试');
      console.error('加载棋局列表失败:', err);
      if (refresh) {
        setGames([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 加载更多数据
  const loadMore = () => {
    if (!isLoading && hasMore) {
      setPage(prevPage => prevPage + 1);
      loadGames(false);
    }
  };

  // 根据搜索查询过滤棋局
  // 删除这里重复声明的排序状态
  // const [sortBy, setSortBy] = useState('date'); // 'date', 'name', 'white', 'black'
  // const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
    
  // 添加排序功能
  const sortGames = (games: GameItem[]) => {
    return [...games].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'white':
          comparison = a.whitePlayer.localeCompare(b.whitePlayer);
          break;
        case 'black':
          comparison = a.blackPlayer.localeCompare(b.blackPlayer);
          break;
        case 'date':
        default:
          // 假设日期格式是ISO字符串或可比较的格式
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };
  
  // 在过滤棋局时应用排序
  const filterGames = () => {
    // 确保games是一个数组
    if (!Array.isArray(games)) {
      setFilteredGames([]);
      return;
    }
    
    if (!searchQuery.trim()) {
      setFilteredGames(games);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = games.filter(
      game =>
        game.name.toLowerCase().includes(query) ||
        game.whitePlayer.toLowerCase().includes(query) ||
        game.blackPlayer.toLowerCase().includes(query)
    );
    
    // 应用排序
    const sorted = sortGames(filtered);
    setFilteredGames(sorted);
  };
  
  // 处理搜索查询变化
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  // 实现高级搜索功能
  const handleAdvancedSearch = () => {
    // 根据高级搜索条件过滤棋局
    if (!Array.isArray(games)) {
      setFilteredGames([]);
      return;
    }
    
    let filtered = [...games];
    
    // 按棋手名称过滤
    if (searchFilters.playerName) {
      const playerName = searchFilters.playerName.toLowerCase();
      filtered = filtered.filter(
        game => 
          game.whitePlayer.toLowerCase().includes(playerName) ||
          game.blackPlayer.toLowerCase().includes(playerName)
      );
    }
    
    // 按日期范围过滤
    if (searchFilters.dateFrom) {
      // 将日期字符串转换为日期对象，并设置为当天开始时间
      const fromDate = new Date(searchFilters.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(game => {
        // 解析游戏日期，处理不同格式
        const gameDate = new Date(game.date);
        gameDate.setHours(0, 0, 0, 0);
        return gameDate >= fromDate;
      });
    }
    
    if (searchFilters.dateTo) {
      // 将日期字符串转换为日期对象，并设置为当天结束时间
      const toDate = new Date(searchFilters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(game => {
        // 解析游戏日期
        const gameDate = new Date(game.date);
        gameDate.setHours(0, 0, 0, 0);
        return gameDate <= toDate;
      });
    }
    
    // 应用排序
    const sorted = sortGames(filtered);
    setFilteredGames(sorted);
    
    // 调试输出
    console.log('高级搜索条件:', searchFilters);
    console.log('过滤后的棋局数量:', filtered.length);
    console.log('过滤后的棋局:', filtered);
  };

  // 更新高级搜索过滤器
  const updateSearchFilter = (key: string, value: string) => {
    setSearchFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 在useEffect中添加高级搜索过滤器的依赖
  useEffect(() => {
    if (showAdvancedSearch) {
      handleAdvancedSearch();
    } else {
      filterGames();
    }
  }, [searchFilters, showAdvancedSearch, games, sortBy, sortOrder]);

  // 添加排序变化时的专用 useEffect
  useEffect(() => {
    console.log('排序方式或顺序变化:', sortBy, sortOrder);
    // 如果有游戏数据，则重新应用排序
    if (games.length > 0) {
      if (showAdvancedSearch) {
        handleAdvancedSearch();
      } else {
        // 直接对当前过滤后的游戏应用排序
        const sorted = sortGames(filteredGames);
        setFilteredGames(sorted);
      }
    }
  }, [sortBy, sortOrder]);

  // 处理排序顺序变化的函数
  const handleSortOrderChange = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    console.log('改变排序顺序:', sortOrder, '->', newOrder);
    setSortOrder(newOrder);
  };

  // 加载特定棋局
  const handleLoadGame = async (gameId: string) => {
    setLoadingGameId(gameId);
    try {
      const gameData = await getGameDetails(gameId);
      onGameLoad(gameData);
      onDismiss();
    } catch (err) {
      setError('无法加载棋局，请稍后再试');
      console.error('加载棋局失败:', err);
    } finally {
      setLoadingGameId(null);
    }
  };

  // 渲染棋局项
  const renderGameItem = ({ item }: { item: GameItem }) => (
    <TouchableOpacity 
      onPress={() => handleLoadGame(item.id)}
      disabled={loadingGameId !== null}
      style={styles.gameItemContainer}
    >
      <View style={styles.gameItem}>
        <View style={styles.iconContainer}>
          <List.Icon icon="chess-king" color="#5d8a48" />
        </View>
        <View style={styles.gameInfoContainer}>
          <Text style={styles.gameTitle}>{item.name}</Text>
          <Text style={styles.gameDescription}>
            白方: {item.whitePlayer} | 黑方: {item.blackPlayer} | 日期: {item.date}
          </Text>
        </View>
        <View style={styles.rightIconContainer}>
          {loadingGameId === item.id ? (
            <ActivityIndicator color="#5d8a48" />
          ) : (
            <List.Icon icon="arrow-right" color="#5d8a48" />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

// 修改样式部分
const styles = StyleSheet.create({
  dialog: {
    borderRadius: 16,
    maxHeight: '80%',
    backgroundColor: '#f5f5f5',
  },
  dialogTitle: {
    textAlign: 'center',
    fontSize: 20,
    color: '#5d8a48',
  },
  dialogContent: {
    paddingHorizontal: 0,
    paddingBottom: 0,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  searchBar: {
    marginBottom: 5,
    backgroundColor: 'white',
    elevation: 0,
    borderRadius: 8,
  },
  advancedSearchButton: {
    alignSelf: 'flex-end',
    padding: 5,
  },
  advancedSearchText: {
    color: '#5d8a48',
    fontSize: 14,
  },
  advancedSearchContainer: {
    marginTop: 5,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  // 添加缺失的样式
  filterLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  filterInput: {
    height: 40,
    backgroundColor: 'white',
    elevation: 0,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dateInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: 'white',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  dateRangeSeparator: {
    marginHorizontal: 8,
    color: '#666',
  },
  // 添加底部按钮样式
  dialogActions: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'flex-end',
    backgroundColor: '#f5f5f5',
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 10,
  },
  // 现有样式保持不变
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  sortLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  sortButtons: {
    flexDirection: 'row',
    flex: 1,
  },
  sortButton: {
    marginRight: 5,
    borderColor: '#5d8a48',
  },
  orderButton: {
    borderColor: '#5d8a48',
  },
  gamesList: {
    maxHeight: 350, // 减小列表高度，为底部按钮留出空间
    backgroundColor: 'transparent',
  },
  gameItemContainer: {
    marginVertical: 4,
    marginHorizontal: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  gameItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  iconContainer: {
    marginRight: 8,
  },
  gameInfoContainer: {
    flex: 1,
  },
  gameTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  gameDescription: {
    fontSize: 14,
    color: '#666',
  },
  rightIconContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 0,
    backgroundColor: 'transparent',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 200,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
    marginHorizontal: 10,
  },
  footerContainer: {
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    marginLeft: 10,
    color: '#5d8a48',
  },
});

  // 渲染分隔线
  const renderSeparator = () => <Divider style={styles.divider} />;

  // 渲染空列表提示
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#5d8a48" />
      ) : (
        <Text style={styles.emptyText}>
          {searchQuery ? '没有找到匹配的棋局' : '没有保存的棋局'}
        </Text>
      )}
    </View>
  );

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title style={styles.dialogTitle}>载入棋局</Dialog.Title>
        <Dialog.Content style={styles.dialogContent}>
          <View style={styles.searchContainer}>
            <Searchbar
              placeholder="搜索棋局名称或棋手"
              onChangeText={handleSearchChange}
              value={searchQuery}
              style={styles.searchBar}
              iconColor="#5d8a48"
            />
            
            <TouchableOpacity 
              onPress={() => setShowAdvancedSearch(!showAdvancedSearch)}
              style={styles.advancedSearchButton}
            >
              <Text style={styles.advancedSearchText}>
                {showAdvancedSearch ? '隐藏高级搜索' : '显示高级搜索'}
              </Text>
            </TouchableOpacity>
            
            {showAdvancedSearch && (
              <View style={styles.advancedSearchContainer}>
                <Text style={styles.filterLabel}>棋手名称:</Text>
                <Searchbar
                  placeholder="输入棋手名称"
                  onChangeText={(value) => updateSearchFilter('playerName', value)}
                  value={searchFilters.playerName}
                  style={styles.filterInput}
                  iconColor="#5d8a48"
                />
                
                <Text style={styles.filterLabel}>日期范围:</Text>
                <View style={styles.dateRangeContainer}>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="开始日期 (YYYY-MM-DD)"
                    value={searchFilters.dateFrom}
                    onChangeText={(value) => updateSearchFilter('dateFrom', value)}
                    keyboardType="default"
                  />
                  
                  <Text style={styles.dateRangeSeparator}>至</Text>
                  
                  <TextInput
                    style={styles.dateInput}
                    placeholder="结束日期 (YYYY-MM-DD)"
                    value={searchFilters.dateTo}
                    onChangeText={(value) => updateSearchFilter('dateTo', value)}
                    keyboardType="default"
                  />
                </View>
              </View>
            )}
          </View>
          
          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>排序方式:</Text>
            <View style={styles.sortButtons}>
              <Button 
                compact 
                mode={sortBy === 'date' ? 'contained' : 'outlined'} 
                onPress={() => setSortBy('date')}
                style={styles.sortButton}
                color="#5d8a48"
              >
                日期
              </Button>
              <Button 
                compact 
                mode={sortBy === 'name' ? 'contained' : 'outlined'} 
                onPress={() => setSortBy('name')}
                style={styles.sortButton}
                color="#5d8a48"
              >
                名称
              </Button>
            </View>
            {/* 排序按钮的点击处理函数 */}
            <Button 
              compact 
              icon={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} 
              onPress={handleSortOrderChange}
              style={styles.orderButton}
              color="#5d8a48"
            >
              {sortOrder === 'asc' ? '升序' : '降序'}
            </Button>
          </View>
          
          {error && <Text style={styles.errorText}>{error}</Text>}
          
          <FlatList
            data={filteredGames}
            renderItem={renderGameItem}
            keyExtractor={item => item.id}
            ItemSeparatorComponent={renderSeparator}
            ListEmptyComponent={renderEmptyList}
            style={styles.gamesList}
            contentContainerStyle={filteredGames.length === 0 ? styles.emptyList : null}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={() => 
              hasMore && filteredGames.length > 0 ? (
                <View style={styles.footerContainer}>
                  <ActivityIndicator color="#5d8a48" size="small" />
                  <Text style={styles.footerText}>加载更多...</Text>
                </View>
              ) : null
            }
          />
        </Dialog.Content>
        <View style={styles.dialogActions}>
          <Button onPress={onDismiss} color="#5d8a48" style={styles.actionButton}>取消</Button>
          <Button onPress={() => loadGames(true)} color="#5d8a48" disabled={isLoading} style={styles.actionButton}>刷新</Button>
        </View>
      </Dialog>
    </Portal>
  );
};

export default LoadGameDialog;