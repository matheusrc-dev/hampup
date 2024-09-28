<template>
  <div>
    <button @click="startRecording">
      {{ isRecording ? 'Parar Gravação' : 'Iniciar Gravação' }}
    </button>
    <h3>Transcrição:</h3>
    <p v-for="(line, index) in transcript" :key="index">
      {{ line.isAssistant ? '🤖' : '👨‍💼' }} {{ line.text }}
    </p>
    <a v-if="audioUrl" :href="audioUrl" download="gravacao.wav">Baixar Gravação</a>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      isRecording: false,
      mediaRecorder: null,
      audioChunks: [],
      transcript: [
        {
          text: 'Olá, como posso te ajudar?',
          isAssistant: true
        }
      ],
      recognition: null,
      audioUrl: null
    }
  },
  methods: {
    startRecording() {
      if (!this.isRecording) {
        this.isRecording = true
        this.startMicrophone()
        this.startTranscription()
      } else {
        this.isRecording = false
        this.stopMicrophone()
        this.stopTranscription()
      }
    },

    async startMicrophone() {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.mediaRecorder = new MediaRecorder(stream)
      this.audioChunks = []
      this.mediaRecorder.start()
      this.transcript = []

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data)
      }

      this.mediaRecorder.onstop = () => {
        console.log('Gravação encerrada')
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' })
        this.audioUrl = URL.createObjectURL(audioBlob)
      }
    },

    stopMicrophone() {
      this.mediaRecorder.stop()
    },

    startTranscription() {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      this.recognition = new SpeechRecognition()
      this.recognition.lang = 'pt-BR'
      this.recognition.interimResults = false
      this.recognition.continuous = true

      this.recognition.onresult = (event) => {
        const lastResult = event.results[event.resultIndex][0].transcript.trim()
        this.transcript.push({ text: lastResult, isAssistant: false })
        this.uploadTranscription(lastResult)
      }

      this.recognition.start()
    },

    stopTranscription() {
      this.recognition.stop()
    },

    async uploadTranscription(transcript) {
      const formData = new FormData()
      formData.append('text', transcript)

      try {
        const response = await axios.post('https://popolin.ngrok.dev/call-response', formData, {
          responseType: 'blob'
        })
        const audioBlob = response.data
        this.transcribeAudioResponse(audioBlob)
        this.playAudioResponse(audioBlob)
      } catch (error) {
        console.error('Erro ao enviar a transcrição:', error)
      }
    },

    async transcribeAudioResponse(audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)

      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        const recognition = new SpeechRecognition()
        recognition.lang = 'pt-BR'
        recognition.interimResults = false
        recognition.continuous = false

        recognition.onresult = (event) => {
          const assistantText = event.results[0][0].transcript.trim()
          this.transcript.push({ text: assistantText, isAssistant: true })
        }

        audio.onended = () => {
          recognition.start()
        }

        audio.play()
      } catch (error) {
        console.error('Erro ao transcrever o áudio da resposta:', error)
      }
    },

    playAudioResponse(audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      audio.play()
    }
  }
}
</script>
