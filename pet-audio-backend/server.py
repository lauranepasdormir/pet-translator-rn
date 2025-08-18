import csv
import numpy as np
import soundfile as sf
import librosa
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
import tensorflow_hub as hub
import io, os, tempfile, subprocess, shutil
import numpy as np, librosa, soundfile as sf

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

# 1) 加载 YAMNet 模型 & 类别表

yamnet = hub.load("https://tfhub.dev/google/yamnet/1")

def class_names_from_csv(class_map_csv_path: str):
    names = []
    with tf.io.gfile.GFile(class_map_csv_path) as f:
        reader = csv.DictReader(f)
        for row in reader:
            names.append(row["display_name"])
    return names

# 从模型资产里拿到 CSV 路径
class_map_path = yamnet.class_map_path().numpy().decode("utf-8")
idx_to_label = class_names_from_csv(class_map_path)

TARGET_SR = 16000

def _has(cmd: str) -> bool:
    return shutil.which(cmd) is not None

def _resample_to_16k_mono(y: np.ndarray, sr: int) -> np.ndarray:
    if y.ndim > 1:
        y = y.mean(axis=1)
    if sr != TARGET_SR:
        y = librosa.resample(y=y, orig_sr=sr, target_sr=TARGET_SR)
    return y.astype(np.float32)

def load_audio_to_16k_mono(bytes_data: bytes):
    """
    一律用 ffmpeg 将任意压缩格式（m4a/aac/mp3等）转成 16kHz 单声道 PCM WAV，再读。
    这样避免 librosa/audioread/soundfile 在不同容器上的行为差异导致“静音”误判。
    """
    # 先把上传的二进制落成临时文件（后缀 .m4a 只是占位，ffmpeg会自动识别）
    with tempfile.NamedTemporaryFile(delete=False, suffix=".m4a") as tmp_in:
        tmp_in.write(bytes_data)
        in_path = tmp_in.name

    # 输出 wav 的临时文件
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_out:
        out_path = tmp_out.name

    try:
        # 强制转换：16k 采样率 + 单声道 + PCM16
        cmd = [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-i", in_path,
            "-ar", "16000", "-ac", "1",
            "-f", "wav", "-acodec", "pcm_s16le",
            out_path
        ]
        subprocess.run(cmd, check=True)

        # 用 soundfile 读回 float32 波形
        wav, sr = sf.read(out_path, dtype="float32", always_2d=False)
        if wav.ndim > 1:
            wav = wav.mean(axis=1)  # 理论上不会发生，因为已 -ac 1

        # 诊断：打印能量和峰值，便于排查“静音”
        rms = float(np.sqrt(np.mean(np.square(wav)))) if wav.size else 0.0
        mx  = float(np.max(np.abs(wav))) if wav.size else 0.0
        print(f"[DECODE] len={wav.size} sr={sr} rms={rms:.6f} maxabs={mx:.6f}")

        if wav.size == 0 or rms < 1e-6 or mx < 1e-5:
            # 近似静音，返回 400 便于前端区分
            raise HTTPException(status_code=400, detail="Audio nearly silent after decode")

        return wav.astype(np.float32), 16000

    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=400, detail=f"ffmpeg transcode failed: {e}")
    finally:
        # 清理临时文件
        try: os.remove(in_path)
        except: pass
        try: os.remove(out_path)
        except: pass



# 关键词更细，涵盖同义词
CAT_KEYS = ["meow", "miaow", "purr", "kitten", "cat"]
DOG_KEYS = ["bark", "woof", "growl", "howl", "whimper", "dog"]
ALERT_KEYS = ["growl", "hiss", "snarl"]

# 太泛/不希望直接作为主判定的类
GENERIC_BAD = {"animal", "domestic animals, pets", "pets", "mammal"}

# 主判定的最低置信度
CONF_THRESH = 0.35

def map_label_to_emotion(label: str):
    s = label.lower()
    if any(k in s for k in CAT_KEYS):
        return "CatMeow", "我在和你说话喵～来陪我玩？"
    if any(k in s for k in DOG_KEYS):
        return "DogBark", "我在汪汪提醒你！要出去走走吗？"
    if any(k in s for k in ALERT_KEYS):
        return "Alert", "我有点紧张/警惕，请注意下环境。"
    return "Unknown", "我在表达心情～快看看我吧！"

def topk(scores: np.ndarray, k: int = 5):
    idx = np.argsort(scores)[-k:][::-1]
    return [(int(i), float(scores[i])) for i in idx]

@app.post("/classify")
async def classify(file: UploadFile = File(...)):
    raw = await file.read()
    wav, sr = load_audio_to_16k_mono(raw)

    # 推理
    scores, _, _ = yamnet(wav)                # [time, classes]
    mean_scores = tf.reduce_mean(scores, axis=0).numpy()

    # Top-5（便于调试）
    tk = topk(mean_scores, k=5)
    predictions = [{
        "raw_label": idx_to_label[i],
        "confidence": round(c, 4)
    } for (i, c) in tk]

    # 选择“主判定”：跳过过于泛的类 & 低置信度项
    best_raw = predictions[0]["raw_label"]
    best_conf = predictions[0]["confidence"]
    if best_raw.lower() in GENERIC_BAD or best_conf < CONF_THRESH:
        for p in predictions:
            if p["raw_label"].lower() not in GENERIC_BAD and p["confidence"] >= CONF_THRESH:
                best_raw, best_conf = p["raw_label"], p["confidence"]
                break

    # 做情绪/文案映射
    label, text = map_label_to_emotion(best_raw)

    return {
        "label": label,
        "text": text,
        "best": {"raw_label": best_raw, "confidence": round(best_conf, 4)},
        "topk": predictions
    }
