import { View, Text, StyleSheet, Pressable } from "react-native";
import { Audio } from "expo-av";

export type Event = { id:string; time:string; label:string; text:string; audioUri?:string; };

export default function EventCard({ event }: { event: Event }) {
  async function play() {
    if (!event.audioUri) return;
    const { sound } = await Audio.Sound.createAsync({ uri: event.audioUri });
    await sound.playAsync();
  }

  return (
    <View style={s.card}>
      <View style={s.row}>
        <Text style={s.time}>{event.time}</Text>
        <Text style={s.badge}>{event.label}</Text>
      </View>
      <Text style={s.text}>{event.text}</Text>
      <View style={s.actions}>
        <Pressable style={s.btn} onPress={play}><Text>▶️ 回放</Text></Pressable>
        <Pressable style={s.btn}><Text>✅ 准</Text></Pressable>
        <Pressable style={s.btn}><Text>❌ 不准</Text></Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card:{ backgroundColor:'#f7f7f9', borderRadius:12, padding:12, marginBottom:12, borderWidth:1, borderColor:'#eee' },
  row:{ flexDirection:'row', justifyContent:'space-between', marginBottom:6 },
  time:{ fontWeight:'600', color:'#333' },
  badge:{ backgroundColor:'#e9f5ff', color:'#1177cc', paddingHorizontal:8, paddingVertical:2, borderRadius:8, overflow:'hidden' },
  text:{ color:'#333', marginBottom:8 },
  actions:{ flexDirection:'row', columnGap:8 },
  btn:{ backgroundColor:'#fff', borderColor:'#ddd', borderWidth:1, paddingHorizontal:10, paddingVertical:6, borderRadius:8 }
});
