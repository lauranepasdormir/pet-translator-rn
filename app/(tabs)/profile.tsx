import { View, Text, TextInput, StyleSheet } from "react-native";
import { useState } from "react";

export default function Profile() {
  const [name, setName] = useState("Minsk");
  const [breed, setBreed] = useState("British Shorthair");

  return (
    <View style={s.c}>
      <Text style={s.title}>宠物档案</Text>
      <TextInput style={s.input} value={name} onChangeText={setName} placeholder="名字" />
      <TextInput style={s.input} value={breed} onChangeText={setBreed} placeholder="品种" />
      <Text style={{ color: "#666" }}>（后续接入“形象编辑器”和健康记录）</Text>
    </View>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginBottom: 10 },
});
