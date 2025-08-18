import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { addEvent } from "../lib/storage";

// iOS 模拟器可用 localhost；真机请改成你的局域网 IP
const API_BASE = "http://localhost:8000";

export default function RecordBar({ onSaved }: { onSaved: () => void }) {
  const recRef = useRef<Audio.Recording | null>(null);
  const [rec, setRec] = useState<Audio.Recording | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      // 1) 权限必须 await
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("需要麦克风权限", "请在系统设置中开启麦克风权限后重试。");
        return;
      }
      // 2) 音频模式也 await
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false, // MVP 先前台
      });
    })();
  }, []);

  async function start() {
    try {
      setBusy(true);
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recRef.current = recording;
      setRec(recording);
    } catch (e) {
      Alert.alert("录音失败", String(e));
    } finally {
      setBusy(false);
    }
  }

  async function stop() {
    if (!recRef.current) return;
    setBusy(true);
    try {
      // 停止并拿到临时文件
      await recRef.current.stopAndUnloadAsync();
      const uri = recRef.current.getURI();
      if (!uri) throw new Error("无文件 URI");

      // 移至持久目录
      const dest = FileSystem.documentDirectory + `pet-${Date.now()}.m4a`;
      await FileSystem.moveAsync({ from: uri, to: dest });

      // —— 调试：文件大小 & 时长 —— //
      const info = await FileSystem.getInfoAsync(dest);
      const status = await recRef.current.getStatusAsync();
      if (info.exists) {
        console.log("saved file:", info.uri, "size:", info.size, "duration ms:", status?.durationMillis);
      } else {
        console.warn("file not found:", info.uri);
      }
      // 1) 上传到后端做分类
      const form = new FormData();
      // @ts-expect-error React Native FormData file
      form.append("file", { uri: dest, name: "audio.m4a", type: "audio/m4a" });

      const res = await fetch(`${API_BASE}/classify`, {
        method: "POST",
        headers: { Accept: "application/json" }, // 不要手动设 Content-Type，让 RN 设置 multipart 边界
        body: form as any,
      });

      if (!res.ok) {
        const text = await res.text();
        console.log("API error:", res.status, text);
        throw new Error(`后端返回错误 ${res.status}`);
      }

      const data = await res.json(); // { label, text, best, topk }
      console.log("API result:", data);

      // 2) 写入事件
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");

      await addEvent({
        id: String(Date.now()),
        time: `${hh}:${mm}`,
        label: data?.label ?? "Unknown",
        text: data?.text ?? "（占位）我在说话呢～",
        audioUri: dest,
        topk: data?.topk, 
      });

      onSaved();
    } catch (e) {
      console.log("save/classify error:", e);
      Alert.alert("保存/分类失败", String(e));
    } finally {
      recRef.current = null;
      setRec(null);
      setBusy(false);
    }
    console.log("documentDirectory:", FileSystem.documentDirectory);
  }

  return (
    <View style={s.bar}>
      {busy ? <ActivityIndicator /> : null}
      {!rec ? (
        <Pressable style={[s.btn, s.red]} onPress={start}>
          <Text style={s.btnText}>● 开始录音</Text>
        </Pressable>
      ) : (
        <Pressable style={[s.btn, s.green]} onPress={stop}>
          <Text style={s.btnText}>■ 停止并保存</Text>
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  bar: { padding: 12, borderTopWidth: 1, borderColor: "#eee", backgroundColor: "#fafafa" },
  btn: { paddingVertical: 12, alignItems: "center", borderRadius: 10 },
  red: { backgroundColor: "#ff4d4f" },
  green: { backgroundColor: "#2bae66" },
  btnText: { color: "#fff", fontWeight: "700" },
});
