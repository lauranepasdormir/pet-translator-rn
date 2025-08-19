# 🎙️ Pet Audio Translator

This project is a **full‑stack application** that records pet audio (frontend) and sends it to a backend server powered by TensorFlow (YAMNet) to classify the sound and return meaningful labels.

---

## 📂 Project Structure

```
pet-translator-rn/
├── pet-audio-frontend/   # React Native frontend (Expo)
├── pet-audio-backend/    # FastAPI backend with TensorFlow model
```

---

## 🚀 Frontend (React Native)

### Requirements
- Node.js 18+
- Yarn or npm
- Expo CLI

### Setup
```bash
cd pet-audio-frontend
npm install
```

### Run on iOS Simulator
```bash
npm run ios
```
To open in iOS Simulator.

---

## 🖥 Backend (FastAPI + TensorFlow)

### Requirements
- Python 3.10
- Virtual environment recommended

### Setup
```bash
cd pet-audio-backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Upgrade pip
python -m pip install --upgrade pip setuptools wheel

# Install requirements.txt (error -> uninstall)
pip install -r requirements.txt
```

### Install Dependencies (Apple Silicon)
```bash
python -m pip uninstall -y tensorflow-macos tensorflow-metal
python -m pip install "tensorflow-macos==2.15.0" "tensorflow-metal==1.1.0" "keras==2.15.0" "tensorflow-hub==0.16.1"
python -m pip install soundfile librosa fastapi "uvicorn[standard]" python-multipart
```

### Install Dependencies (Intel Mac)
```bash
python -m pip uninstall -y tensorflow tensorflow-intel
python -m pip install "tensorflow==2.15.0" "keras==2.15.0" "tensorflow-hub==0.16.1"
python -m pip install soundfile librosa fastapi "uvicorn[standard]" python-multipart
```

### Run Backend
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## 🔗 API Endpoints

### Upload Audio
**POST** `/upload`

Form-data:
- `file`: audio file (.wav)

Response example:
```json
{
  "label": "Bark",
  "text": "The pet is barking",
  "best": { "confidence": 0.82, "raw_label": "Dog bark" },
  "topk": [
    { "confidence": 0.82, "raw_label": "Dog bark" },
    { "confidence": 0.12, "raw_label": "Speech" }
  ]
}
```

---

## ⚡ Development Tips

- Run backend first (`uvicorn`) then frontend (Expo).
- Make sure iOS Simulator microphone is enabled.
- Clear simulator storage if stale audio files remain.

---

## ✅ TODO

- [x] Record audio and send to backend
- [x] Integrate YAMNet model
- [x] Show recognition result in EventCard
- [x] Loading / error states
- [ ] Add more polished UI
- [ ] Improve model labels (map to pet-friendly text)

---

## 📜 License
MIT
