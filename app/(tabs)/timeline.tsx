// app/(tabs)/timeline.tsx
import { useCallback, useEffect, useState } from "react";
import { View, FlatList, StyleSheet, RefreshControl, Pressable, Text, Alert } from "react-native";
import EventCard from "../../components/EventCard";
import RecordBar from "../../components/RecordBar";
import { EventItem, loadEvents, clearEvents } from "../../lib/storage";

export default function Timeline() {
  const [list, setList] = useState<EventItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    const data = await loadEvents();
    setList(data);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onClear = async () => {
    await clearEvents();
    Alert.alert("已清空", "所有事件已删除");
    fetchData();
  };

  return (
    <View style={s.c}>
      {/* 顶部工具条：清空按钮 */}
      <View style={s.toolbar}>
        <Pressable style={s.clearBtn} onPress={onClear}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>清空事件</Text>
        </Pressable>
      </View>

      <FlatList
        data={list}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 96 }}
        renderItem={({ item }) => <EventCard event={item} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} />}
        ListEmptyComponent={<Text style={{ textAlign:'center', color:'#888' }}>暂无事件</Text>}
      />

      <View style={s.recWrap}>
        <RecordBar onSaved={fetchData} />
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  c:{ flex:1, backgroundColor:"#fff" },
  toolbar:{ padding:12, borderBottomWidth:1, borderColor:"#eee", backgroundColor:"#fafafa" },
  clearBtn:{ alignSelf:"flex-end", backgroundColor:"#f44336", paddingHorizontal:12, paddingVertical:8, borderRadius:8 },
  recWrap:{ position:"absolute", left:0, right:0, bottom:0 }
});
