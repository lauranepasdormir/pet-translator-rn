import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";

export default function Home() {
  const router = useRouter();
  return (
    <View style={s.c}>
      <Text style={s.title}>🐾 宠物翻译 & 健康助手</Text>
      <Text style={s.sub}>自动检测叫声 · 翻译成可读文字</Text>

      <Pressable style={s.btn} onPress={() => router.push("/timeline")}>
        <Text style={s.btnText}>进入时间线</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 8 },
  sub: { fontSize: 14, color: "#555", marginBottom: 24, textAlign: "center" },
  btn: {
    backgroundColor: "#2f6feb",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  btnText: { color: "#fff", fontWeight: "600" },
});
