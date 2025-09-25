# gmeet-bot

This example project will help you record and transcribe using Deepgram a google meet meeting from a container with a audio and video using virtual sound card (pulseaudio) and screen recording with Xscreen.

One of the main challenge is to record the session without a sound card using audio loop sink and not being flagged by the meeting provider (in this case google meet).

This project is a proof of concept with limited support and is not meant for production grade usage.

## Required API Keys

Before running the project, you need to set up the following API keys:

1. **Google API Key** - For Gemini LLM processing
   ```bash
   export GOOGLE_API_KEY="your_google_api_key_here"
   ```

2. **Deepgram API Key** - For speech-to-text transcription
   ```bash
   export DEEPGRAM_API_KEY="your_deepgram_api_key_here"
   ```

   You can get a Deepgram API key from [Deepgram Console](https://console.deepgram.com/).

3. **Gmail Credentials** - For Google Meet authentication
   - `GMAIL_USER_EMAIL` - Your Gmail address
   - `GMAIL_USER_PASSWORD` - Your Gmail password or app-specific password

## Build:

```
docker build -t gmeet -f Dockerfile .
```

## Usage:

```
docker run -it \
    -e GMEET_LINK=https://meet.google.com/my-gmeet-id \
    -e GMAIL_USER_EMAIL=myuser1234@gmail.com \
    -e GMAIL_USER_PASSWORD=my_gmail_password \
    -e DURATION_IN_MINUTES=1 \ #duration of the meeting to record
    -e DEEPGRAM_API_KEY=YOUR_DEEPGRAM_API_KEY \
    -e GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY \
    -e MAX_WAIT_TIME_IN_MINUTES=2 \ #max wait time in the lobby
    -v $PWD/recordings:/app/recordings \ # local storage for the recording
    -v $PWD/screenshots:/app/screenshots \ # local storage for intermediate bot screenshots
    gmeet
```
```
# Option 1: Host networking (recommended for Linux)
docker run -it --network host \
  -e GMAIL_USER_EMAIL="retr0gmr9@gmail.com" \
  -e GMAIL_USER_PASSWORD="asdfghjklL@" \
  -e GOOGLE_API_KEY="AIzaSyBa_nwjFaausgvUyzaW0-3vdHM3S9pFb3Q" \
  -e DEEPGRAM_API_KEY="f97100f7e06b2a50352535151a0208acc0ec35d2" \
  -e SERVER_API="http://localhost:5000" \
  -e MAX_WAIT_TIME_IN_MINUTES="1" \
  -v "$(pwd)/storage:/app/storage" \
  gmeet

# Option 2: Bridge network with host IP (alternative)
# HOST_IP=$(ip route | grep default | awk '{print $3}')
# docker run -it \
#   -e GMAIL_USER_EMAIL="retr0gmr9@gmail.com" \
#   -e GMAIL_USER_PASSWORD="qwertyuiopP@" \
#   -e GOOGLE_API_KEY="AIzaSyCdOl7vPoQGghstD2Q1jGKwiA3g03PupMY" \
#   -e DEEPGRAM_API_KEY="f97100f7e06b2a50352535151a0208acc0ec35d2" \
#   -e SERVER_API="http://$HOST_IP:5000" \
#   -e MAX_WAIT_TIME_IN_MINUTES="1" \
#   -v "$(pwd)/storage:/app/storage" \
#   gmeet
```
